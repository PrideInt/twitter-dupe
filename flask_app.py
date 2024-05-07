from flask import Flask, render_template, request, redirect, session, make_response
from flask_session import Session
import json
import boto3
import uuid
import datetime

app = Flask(__name__)
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
Session(app)

# Final project

@app.route('/')
def final():
    if is_logged_in():
        return render_template('final.html')
    return redirect("/signup")

@app.route('/signup')
def signup():
    if is_logged_in():
        return redirect("/profile")
    return render_template('final_signup.html')

@app.route('/login')
def login():
    if is_logged_in():
        return redirect("/profile")
    return render_template('final_login.html')

@app.route('/home')
def home():
    return render_template('final.html')

@app.route('/profile')
def profile():
    if not is_logged_in():
        return redirect("/login")
    return render_template('profile.html')

@app.route('/profile/<username>')
def profile_other(username):
    return render_template('profile.html')

@app.route('/settings')
def settings():
    return render_template('settings.html')

@app.route('/final/timeline')
def timeline():
    threads = get_table('threads')

    items = threads.scan()['Items']

    return { 'items': items }

@app.route('/thread/<id>')
def reply(id):
    return render_template('tweet.html')

@app.route('/final/post', methods=['POST'])
def post():
    bucket = get_public_bucket()
    table = get_table('threads')
    members = get_table('members')

    file = request.files.get("attachment", None)
    filename = '0'
    source = '0'

    if file is not None:
        filename = file.filename
        source = '' + filename
        bucket.upload_fileobj(file, filename)

    content = request.form.get("content")

    username = session["username"]

    item = members.get_item(Key = { "username": username })["Item"]
    display_name = item['display_name']
    pfp = item['pfp']
    likes = 0
    posts = int(item["posts"]) + 1

    data = { 'id': str(uuid.uuid4()), 'username': username, 'display_name': display_name, 'pfp': pfp, 'content': content, 'likes': likes, 'liked_by': [], 'source': source, 'replies': [], 'reply_to': 'None', 'date_posted': get_date() }
    table.put_item(Item = data)

    member_data = { 'username': item["username"], 'banner': item["banner"], 'date_joined': item["date_joined"], 'display_name': item["display_name"], 'engagement': item["engagement"], 'likes': item["likes"], 'posts': posts, 'pfp': item["pfp"], 'password': item["password"] }
    members.put_item(Item = member_data)

    return { 'results': 'OK' }

@app.route('/final/signup/<username>/<password>')
def handle_signup(username, password):
    table = get_table('members')

    item = table.get_item(Key = { "username": username })

    if 'Item' in item:
        return { 'results': 'Username already exists.' }

    return { 'results': 'OK', 'username': username, 'password': password }

@app.route('/final/signup-post', methods=['POST'])
def update_signup():
    username = request.form.get("username")
    password = request.form.get("password")

    table = get_table('members')

    date_raw = datetime.datetime.now().isoformat()
    t_idx = date_raw.index('T')

    date = date_raw[:t_idx]

    data = { 'username': username, 'password': password, 'display_name': username, 'date_joined': date, 'engagement': 0, 'pfp': '', 'banner': '', 'posts': 0, 'likes': 0,  }
    table.put_item(Item = data)

    session["username"] = username

    return { 'results': 'OK' }

@app.route('/final/login/<username>/<password>')
def handle_login(username, password):
    table = get_table("members")
    item = table.get_item(Key = { "username": username })

    if 'Item' not in item:
        return { 'results': 'Username not found.' }

    user = item['Item']

    if password != user['password']:
        return { 'results': 'Password does not match.' }

    return { 'results': 'OK', 'username': username }

@app.route('/final/login-post', methods=['POST'])
def update_login():
    username = request.form.get("username")

    session["username"] = username

    return { 'results': 'OK' }

@app.route('/logout')
def handle_logout():
    session.pop("username", None)

    response = make_response(redirect("/signup"))
    return response

@app.route('/final/uploadpfp', methods=['POST'])
def upload_pfp():
    table = get_table("members")
    bucket = get_public_bucket()
    item = table.get_item(Key = { "username": session["username"] })
    member = item['Item']

    req_pfp = request.files["pfp"]
    pfp = member["pfp"]

    if req_pfp is not None and req_pfp.filename != '':
        pfp =  req_pfp.filename

    bucket.upload_fileobj(req_pfp, pfp)
    data = { 'username': session["username"], 'password': member["password"], 'display_name': member["display_name"], 'date_joined': member["date_joined"], 'engagement': member["engagement"], 'pfp': '' + pfp, 'banner': member["banner"], 'posts': member["posts"], 'likes': member["likes"] }
    table.put_item(Item = data)

    threads = get_table("threads")
    items = threads.scan()['Items']

    for i in range(len(items)):
        if items[i]['username'] == session["username"]:
            thread = items[i]
            thread_data = { 'id': thread["id"], 'username': thread["username"], 'display_name': thread["display_name"], 'engagement': member["engagement"], 'pfp': '' + pfp, 'content': thread["content"], 'likes': thread["likes"], 'liked_by': thread["liked_by"], 'source': thread["source"], 'replies': thread["replies"], 'reply_to': thread["reply_to"], 'date_posted': thread["date_posted"] }
            threads.put_item(Item = thread_data)

    return { 'results': 'OK' }

@app.route('/final/uploadbanner', methods=['POST'])
def upload_banner():
    table = get_table("members")
    bucket = get_public_bucket()
    item = table.get_item(Key = { "username": session["username"] })
    member = item['Item']

    req_banner = request.files["banner"]
    banner = member["banner"]

    if req_banner is not None and req_banner.filename != '':
        banner = req_banner.filename

    bucket.upload_fileobj(req_banner, banner)
    data = { 'username': session["username"], 'password': member["password"], 'display_name': member["display_name"], 'date_joined': member["date_joined"], 'engagement': member["engagement"], 'pfp': member["pfp"], 'banner': '' + banner, 'posts': member["posts"], 'likes': member["likes"] }
    table.put_item(Item = data)

    return { 'results': 'OK' }

@app.route('/final/applychanges', methods=['POST'])
def apply_changes():
    table = get_table("members")
    item = table.get_item(Key = { "username": session["username"] })
    member = item['Item']

    req_display_name = request.form.get("display_name")
    req_username = request.form.get("username")
    req_password = request.form.get("password")

    display_name = member["display_name"]
    prev_username = session["username"]
    username = session["username"]
    password = member["password"]

    if req_display_name != '':
        display_name = req_display_name

    if req_password != '':
        password = req_password

    if req_username != '':
        username = req_username

    table.delete_item(Key = { "username": session["username"] })
    session["username"] = username

    data = { 'username': username, 'password': password, 'display_name': display_name, 'date_joined': member["date_joined"], 'engagement': member["engagement"], 'pfp': member["pfp"], 'banner': member["banner"], 'posts': member["posts"], 'likes': member["likes"] }
    table.put_item(Item = data)

    threads = get_table("threads")
    items = threads.scan()['Items']

    for i in range(len(items)):
        if items[i]['username'] == prev_username:
            thread = items[i]
            thread_data = { 'id': thread["id"], 'username': username, 'display_name': display_name, 'pfp': thread["pfp"], 'content': thread["content"], 'likes': thread["likes"], 'liked_by': thread["liked_by"], 'source': thread["source"], 'replies': thread["replies"], 'reply_to': thread["reply_to"], 'date_posted': thread["date_posted"] }
            threads.put_item(Item = thread_data)

    return { 'results': 'OK' }

@app.route('/user/<username>')
def get_user(username):
    user = username

    if username == 'current':
        if not is_logged_in():
            return { 'profile': None }

        user = session["username"]

    table = get_table("members")
    item = table.get_item(Key = { "username": user })

    return { 'profile': item['Item'] }

@app.route('/final/members')
def get_members():
    table = get_table("members")
    members = table.scan()['Items']

    return { 'members': members }

@app.route('/threads/<username>')
def get_threads_by_username(username):
    user = username

    if username == 'current':
        if not is_logged_in():
            return { 'profile': None }

        user = session["username"]

    table = get_table('threads')
    items = table.scan()['Items']

    threads = []

    for i in range(len(items)):
        if items[i]['username'] == user:
            threads.append(items[i])

    return { 'threads': threads }

@app.route('/final/thread/<id>')
def get_thread_by_id(id):
    table = get_table("threads")
    thread = table.get_item(Key = { "id": id })

    replies = thread["Item"]["replies"]
    replies_list = []

    for i in range(len(replies)):
        reply = table.get_item(Key = { "id": replies[i]["id"] })["Item"]
        replies_list.append(reply)

    return { 'thread': thread["Item"], 'replies': replies_list }

@app.route('/final/thread-addlike', methods=['POST'])
def handle_likes():
    likes = request.form.get("likes")
    id = request.form.get("id")

    table = get_table("threads")
    item = table.get_item(Key = { "id": id })
    thread = item['Item']

    members = get_table("members")
    member = members.get_item(Key = { "username": thread["username"] })["Item"]

    liked_by = thread["liked_by"]

    op_likes = int(member["likes"])
    like_count = int(likes)

    if session["username"] in liked_by:
        like_count = like_count - 1
        op_likes = op_likes - 1
        liked_by.remove(session["username"])
    else:
        like_count = like_count + 1
        op_likes = op_likes + 1
        liked_by.append(session["username"])

    data = { 'id': thread["id"], 'content': thread["content"], 'display_name': thread["display_name"], 'liked_by': liked_by, 'likes': like_count, 'pfp': thread["pfp"], 'source': thread["source"], 'username': thread["username"], 'replies': thread["replies"], 'reply_to': thread["reply_to"], 'date_posted': thread["date_posted"] }
    table.put_item(Item = data)

    member_data = { 'username': member["username"], 'banner': member["banner"], 'date_joined': member["date_joined"], 'display_name': member["display_name"], 'engagement': member["engagement"], 'likes': op_likes, 'posts': member["posts"], 'pfp': member["pfp"], 'password': member["password"] }
    members.put_item(Item = member_data)

    return { 'results': 'OK' }

@app.route('/final/reply', methods=['POST'])
def handle_replies():
    bucket = get_public_bucket()
    table = get_table('threads')
    members = get_table('members')

    id = request.form.get("op_id")
    content = request.form.get("content")
    attachment = request.files.get("attachment", None)

    item = table.get_item(Key = { "id": id })
    thread = item['Item']

    source = '0'

    if attachment is not None:
        filename = attachment.filename
        source = '' + filename
        bucket.upload_fileobj(attachment, filename)

    replies = thread["replies"]
    op = thread["username"]

    username = session["username"]

    member = members.get_item(Key = { "username": username })["Item"]
    display_name = member['display_name']
    pfp = member['pfp']
    likes = 0

    reply_id = str(uuid.uuid4())

    reply_data = { 'id': reply_id, 'username': username, 'display_name': display_name, 'pfp': pfp, 'content': content, 'likes': likes, 'liked_by': [], 'source': source, 'replies': [], 'reply_to': op, 'date_posted': get_date() }

    replies.append({ 'id': reply_id })

    data = { 'id': id, 'username': thread["username"], 'display_name': thread["display_name"], 'pfp': thread["pfp"], 'content': thread["content"], 'likes': thread["likes"], 'liked_by': thread["liked_by"], 'source': thread["source"], 'replies': replies, 'reply_to': thread["reply_to"], 'date_posted': thread["date_posted"] }
    table.put_item(Item = data)
    table.put_item(Item = reply_data)

    member_data = { 'username': member["username"], 'banner': member["banner"], 'date_joined': member["date_joined"], 'display_name': member["display_name"], 'engagement': member["engagement"], 'likes': member["likes"], 'posts': int(member["posts"]) + 1, 'pfp': member["pfp"], 'password': member["password"] }
    members.put_item(Item = member_data)

    return { 'results': 'OK' }

def get_public_bucket():
    s3 = boto3.resource(service_name = 's3', region_name = 'us-east-1', aws_access_key_id = '', aws_secret_access_key = '')
    bucket = s3.Bucket('')
    return bucket

def get_table(tab):
    client = boto3.resource(service_name='dynamodb', region_name='us-east-1', aws_access_key_id = '', aws_secret_access_key = '')
    table = client.Table(tab)
    return table

def is_logged_in():
    return session.get("username")

def get_date():
    date_raw = datetime.datetime.now().isoformat()
    t_idx = date_raw.index('T')
    sec_end = date_raw.index('.')

    date = date_raw[:t_idx] + ', ' + date_raw[t_idx + 1:sec_end]
    return date