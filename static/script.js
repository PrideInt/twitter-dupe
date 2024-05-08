const load = (url, func) => {
    const xhttp = new XMLHttpRequest();
    xhttp.onload = () => {
        if (xhttp.status == 200) {
            func(xhttp.response);
        }
    }
    xhttp.open("GET", url);
    xhttp.send();
}

/*
FINAL PROJECT
*/

const signUp = () => {
    let username = document.getElementById("signupUsername").value;
    let password = document.getElementById("signupPassword").value;

    if (username.value == '' || password.value == '') {
        alert("Username and/or password can not be blank.");
        return;
    }
    load("/final/signup/" + username + '/' + password, signUpResponse);
}

const signUpResponse = (response) => {
    let data = JSON.parse(response);

    const username = data["username"];
    const password = data["password"];

    if (data["results"] != "OK") {
        alert(data["results"]);
        return;
    } else {
        let xhttp = new XMLHttpRequest();
        xhttp.onload = () => {
            if (xhttp.status == 200) {
                reload(xhttp.response);
            }
        }
        xhttp.open('POST', '/final/signup-post', true);
        var formData = new FormData();
        formData.append("username", username);
        formData.append("password", password);

        xhttp.send(formData);
    }
}

const logIn = () => {
    let username = document.getElementById("loginUsername").value;
    let password = document.getElementById("loginPassword").value;

    if (username.value == '' || password.value == '') {
        alert("Username and/or password can not be blank.");
        return;
    }
    load("/final/login/" + username + '/' + password, logInResponse);
}

const logInResponse = (response) => {
    let data = JSON.parse(response);

    const username = data["username"];

    if (data["results"] != "OK") {
        alert(data["results"]);
        return;
    } else {
        let xhttp = new XMLHttpRequest();
        xhttp.onload = () => {
            if (xhttp.status == 200) {
                reload(xhttp.response);
            }
        }
        xhttp.open('POST', '/final/login-post', true);
        var formData = new FormData();
        formData.append("username", username);

        xhttp.send(formData);
    }
}

const doRenderSidebar = () => {
    load("/loggedin", renderSidebar);
}

const renderSidebar = (response) => {
    let loggedIn = JSON.parse(response)["logged_in"];

    const sidebarDoc = document.getElementById("sidebar");
    let sidebarDiv = "<ol>";
    sidebarDiv += `<li class="sidebar_selection"><a href="/home"><h1>HOME</h1></a></li>`;

    if (loggedIn) {
        sidebarDiv += `<div class="hor_line"></div>
                        <li class="sidebar_selection"><a href="/profile"><h1>PROFILE</h1></a></li>
                        <div class="hor_line"></div>
                        <li class="sidebar_selection"><a href="/settings"><h1>SETTINGS</h1></a></li>
                        <div class="hor_line"></div>
                        <li class="sidebar_selection"><a href="/logout"><h1>LOGOUT</h1></a></li>
                    </ol>`
    } else {
        sidebarDiv += `</ol>`;
    }
    sidebarDoc.innerHTML = sidebarDiv;
}

const doRenderProfile = () => {
    let url = window.location.href;
    const partition = url.split('/');

    if (partition.length > 4) {
        load("/user/" + partition[4], renderProfile);
    } else {
        load("/user/current", renderProfile);
    }
}

const renderProfile = (response) => {
    let data = JSON.parse(response);
    let profile = data["profile"];

    if (profile == null || profile.length == 0) {
        return;
    }
    let username = profile["username"];
    let displayName = profile["display_name"];
    let dateJoined = profile["date_joined"];
    let pfp = profile["pfp"];
    let profileBanner = profile["banner"];
    let likes = profile["likes"];
    let posts = profile["posts"];

    let profileDetails = document.getElementById("profile_details");
    if (profileDetails != null) {
        let details = "";

        details += `<div class="profile_picture" style="background-image: url(${pfp});"></div>` +
            "<h1 class=\"profile_name\">" + displayName + "</h1>" +
            "<p style=\"font-size: 18px; color: grey;\">@" + username + "</p>" +
            "<p style=\"font-size: 18px; color: grey;\">Joined: " + dateJoined + "</p>";

        profileDetails.innerHTML = details;
    }

    const profileBannerDoc = document.getElementById("profile_banner");
    if (profileBannerDoc != null) {
        let banner = `<div class="banner" style="background-image: url('${profileBanner}');"></div>`

        profileBannerDoc.innerHTML = banner;
    }

    const profileInformation = document.getElementById("profile_information");
    if (profileInformation != null) {
        let information = "";

        information += "<div style=\"display: inline-block;\">" +
                            "<center><h1 style=\"margin-left: 100px; margin-right: 100px;\">THREADS</h1></center>" +
                            "<center><h1 id=\"tweets\" style=\"margin-left: 100px; margin-right: 100px;\">" + posts + "</h1></center>" +
                        "</div>" +

                        "<div style=\"display: inline-block;\">" +
                            "<center><h1 style=\"margin-left: 100px; margin-right: 100px;\">LIKES</h1></center>" +
                            "<center><h1 id=\"likes\" style=\"margin-left: 100px; margin-right: 100px;\">" + likes + "</h1></center>" +
                        "</div>";

        profileInformation.innerHTML = information;
    }
}

const doRenderThreads = () => {
    let url = window.location.href;
    const partition = url.split('/');

    if (partition.length > 4) {
        load("/threads/" + partition[4], renderThreads);
    } else {
        load("/threads/current", renderThreads);
    }
}

const renderThreads = (response) => {
    let data = JSON.parse(response);
    let threads = data["threads"];
    sortThreads(threads);

    const posts = document.getElementById("profile_posts");

    let post = "";
    for (let i = 0; i < threads.length; i++) {
        let username = threads[i]["username"];
        let pfp = threads[i]["pfp"];
        let displayName = threads[i]["display_name"];
        let content = threads[i]["content"];
        let likes = threads[i]["likes"];
        let attachment = threads[i]["source"];
        let id = threads[i]["id"];
        let replyTo = threads[i]["reply_to"];
        let datePosted = threads[i]["date_posted"];

        let likeDiv = "<p></p>";
        if (likes > 0) {
            likeDiv = "<p class=\"like_count\">" + likes + "</p>";
        }

        let attachmentDiv = "";
        if (attachment != "0") {
            attachmentDiv = `<img class="attachment" src="${attachment}"></img>`;
        }

        let replyToDiv = "";
        if (replyTo != "None") {
            replyToDiv = `<a href="/profile/${replyTo}"><p style="display: inline-block; color: #606f91; margin-right: 5px">@${replyTo}</p></a>`;
        }

        post += `<div class="tweet" onClick="redirect('/thread/${id}')">` +
                    "<div class=\"tweet_content\">" +
                        `<div class=\"tweet_profile_picture\" style=\"margin-top: 10px; background-image: url(${pfp});\"></div>` +
                        "<h2 style=\"display: inline-block; margin-left: 65px\">" + displayName + "</h2>" +
                        "<p style=\"display: inline-block; margin-left: 5px; font-size: 18px; color: grey\">@" + username + "</p>" +

                        "<div class=\"tweet_text\">" +
                            replyToDiv +
                            "<p style=\"display: inline-block\">" + content + "</p>" +
                        "</div>" +

                        "<div>" +
                            attachmentDiv +

                            "<div>" +
                                `<p style=\"color: grey\">${datePosted}</p>` +
                            "</div>" +

                            "<div>" +
                                `<img class="like" src="" onClick="doAddLike('${id}');"></img>` +
                                likeDiv +
                            "</div>" +
                        "</div>" +
                    "</div>" +
                "</div>"
    }
    posts.innerHTML = post;
}

const redirect = (url) => {
    window.location.replace(url);
}

const doRenderReplies = () => {
    let url = window.location.href;
    const partition = url.split('/');

    load('/final/thread/' + partition[partition.length - 1], renderReplies);
}

// This whole function can be refactored bc it looks so ugly right now but I'm very lazy
const renderReplies = (response) => {
    let data = JSON.parse(response);
    let thread = data["thread"];
    let replies = data["replies"];
    let user = data["user"];
    let parent = data["parent"];
    sortThreads(replies);

    /*
    If a parent post exists, display it
    */

    const parentDoc = document.getElementById("parent");

    if (parent != "None") {
        let parentAttachmentDiv = "";
        if (parent["source"] != "0") {
            parentAttachmentDiv = `<img class="attachment" src="${parent["source"]}"></img>`;
        }
        let parentLikeDiv = "<p></p>";
        if (parent["likes"] > 0) {
            parentLikeDiv = "<p class=\"like_count\">" + parent["likes"] + "</p>";
        }

        let parentDiv = `<div class="tweet" style="background-color: #404040; width: auto; max-width: 800px; margin-bottom: 10px; border-radius: 10px;" onClick="redirect('/thread/${parent["id"]}')">
                            <div class="tweet_content">
                                <div class="reply_profile_picture" style="margin-top: 10px; background-image: url('${parent["pfp"]}');" onClick="redirect('/profile/${parent["username"]}')"></div>
                                <a href="/profile/${parent["username"]}"><h2 style="display: inline-block; margin-left: 80px; font-size: 32px;">${parent["display_name"]}</h2></a>
                                <a href="/profile/${parent["username"]}"><p style="display: inline-block; margin-left: 5px; font-size: 24px; color: grey">@${parent["username"]}</p></a>

                                <div class="tweet_text">
                                    <p>${parent["content"]}</p>
                                </div>

                                <div>
                                    ${parentAttachmentDiv}

                                    <div>
                                        <p style=\"color: grey\">${parent["date_posted"]}</p>
                                    </div>

                                    <div>
                                        <img class="like" src="" onClick="doAddLike('${parent["id"]}');"></img>
                                        ${parentLikeDiv}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <div class="hor_line"></div>
                        </div>`;

        parentDoc.innerHTML = parentDiv;
    }

    /*
    Original post display
    */

    let opId = thread["id"];
    let opPfp = thread["pfp"];
    let opDisplayName = thread["display_name"];
    let opUsername = thread["username"];
    let opLikes = thread["likes"];
    let opContent = thread["content"];
    let opAttachment = thread["source"];
    let opDatePosted = thread["date_posted"];

    /*
    Reply box and button here. Need opId first, so that's why it's not above
    */
    const replySection = document.getElementById("reply_section");

    let replySectionDiv = "<input class=\"reply_content\" id=\"reply_content\" placeholder=\"Reply here\"></input>" +
                    "<input class=\"attach_button\" id=\"reply_attach_button\" type=\"file\"></input>" +
                    `<button class="reply_button" onClick="addReply('${opId}')">Reply</button>`;

    replySection.innerHTML = replySectionDiv;

    /*
    If the current logged in user is also the user of the post, give them a delete button
    */
    if (opUsername == user) {
        const deleteButton = document.getElementById("delete_button");

        let deleteButtonDiv = `<button class="signup_button" onClick="deleteThread('${opId}')" style="width: 5%; height: 3%; background-color: #664248; color: black; border-color: #8c5b57; float: right; margin-right: 30px; margin-top: 20px;">Delete</button>`;

        deleteButton.innerHTML = deleteButtonDiv;
    }

    let opAttachmentDiv = "";
    if (opAttachment != "0") {
        opAttachmentDiv = `<img class="attachment" src="${opAttachment}"></img>`;
    }
    let opLikeDiv = "<p></p>";
    if (opLikes > 0) {
        opLikeDiv = "<p class=\"like_count\">" + opLikes + "</p>";
    }

    /*
    Display original stuff
    */
    const originalPost = document.getElementById("main_tweet");

    let opDiv = "";

    opDiv += `<div class="reply_profile_picture" style="margin-top: 10px; background-image: url('${opPfp}');" onClick="redirect('/profile/${opUsername}')"></div>` +
                `<a href="/profile/${opUsername}"><h2 style="display: inline-block; margin-left: 80px; font-size: 32px;">${opDisplayName}</h2></a>` +
                `<a href="/profile/${opUsername}"><p style="display: inline-block; margin-left: 5px; font-size: 24px; color: grey">@${opUsername}</p></a>` +

                "<div class=\"tweet_text\">" +
                    "<p style=\"font-size: 24px\">" + opContent + "</p>" +
                "</div>" +

                "<div>" +
                    opAttachmentDiv +

                    "<div>" +
                        `<p style=\"color: grey\">${opDatePosted}</p>` +
                    "</div>" +

                    "<div>" +
                        `<img class="like" src="" onClick="doAddLike('${opId}');"></img>` +
                        opLikeDiv +
                    "</div>" +
                "</div>";

    originalPost.innerHTML = opDiv;

    /*
    Display replies
    */
    const repliesDoc = document.getElementById("replies");

    let repliesDiv = "";

    for (let i = 0; i < replies.length; i++) {
        let id = replies[i]["id"];

        let username = replies[i]["username"];
        let pfp = replies[i]["pfp"];
        let displayName = replies[i]["display_name"];
        let content = replies[i]["content"];
        let likes = replies[i]["likes"];
        let attachment = replies[i]["source"];
        let replyTo = replies[i]["reply_to"];
        let datePosted = replies[i]["date_posted"];

        let likeDiv = "<p></p>";
        if (likes > 0) {
            likeDiv = "<p class=\"like_count\">" + likes + "</p>";
        }

        let attachmentDiv = "";
        if (attachment != "0") {
            attachmentDiv = `<img class="attachment" src="${attachment}"></img>`;
        }

        let replyToDiv = "";
        if (replyTo != "None") {
            replyToDiv = `<a href="/profile/${replyTo}"><p style="display: inline-block; color: #606f91; margin-right: 5px">@${replyTo}</p></a>`;
        }

        repliesDiv += `<div class="reply" onClick="redirect('/thread/${id}')">` +
                    "<div class=\"tweet_content\">" +
                        `<div class="tweet_profile_picture" style="margin-top: 10px; background-image: url(${pfp});" onClick="redirect('/profile/${username}')"></div>` +
                        `<a href="/profile/${username}"><h2 style="display: inline-block; margin-left: 65px">${displayName}</h2>` +
                        `<a href="/profile/${username}"><p style="display: inline-block; margin-left: 5px; font-size: 18px; color: grey">@${username}</p>` +

                        "<div class=\"tweet_text\">" +
                            replyToDiv +
                            "<p style=\"display: inline-block\">" + content + "</p>" +
                        "</div>" +

                        "<div>" +
                            attachmentDiv +

                            "<div>" +
                                `<p style=\"color: grey\">${datePosted}</p>` +
                            "</div>" +

                            "<div>" +
                                `<img class="like" src="" onClick="doAddLike('${id}');"></img>` +
                                likeDiv +
                            "</div>" +
                        "</div>" +
                    "</div>" +
                "</div>";
    }
    repliesDoc.innerHTML = repliesDiv;
}

const addReply = (id) => {
    if (document.getElementById('reply_content').value == '' && document.getElementById('reply_attach_button').files[0] == undefined) {
        return;
    }
    let xhttp = new XMLHttpRequest();
    xhttp.onload = () => {
        if (xhttp.status == 200) {
            reload(xhttp.response);
        }
    }
    xhttp.open('POST', '/final/reply', true);
    var formData = new FormData();
    formData.append("op_id", id)
    formData.append("attachment", document.getElementById('reply_attach_button').files[0]);
    formData.append("content", document.getElementById('reply_content').value)

    xhttp.send(formData);
}

const deleteThread = (id) => {
    let xhttp = new XMLHttpRequest();
    xhttp.onload = () => {
        if (xhttp.status == 200) {
            redirect('/profile');
        }
    }
    xhttp.open('POST', '/final/thread-delete', true);
    var formData = new FormData();
    formData.append("id", id)

    xhttp.send(formData);
}

const timeline = () => {
    load('/final/timeline', loadTimeline);
}

const loadTimeline = (response) => {
    let data = JSON.parse(response);
    let loggedIn = data["logged_in"];
    let items = data["items"];
    sortThreads(items);

    let homeTweetDoc = document.getElementById("home_tweet");
    if (loggedIn) {
        homeTweetDoc.innerHTML = `<h2 style="margin-left: 30px">Share your thoughts:</h2>
                                    <input class="home_tweet_content" id="home_tweet_content">
                                    <input class="attach_button" id="attach_button" type="file"></input>
                                    <button class="home_tweet_button" id="home_tweet_button" onClick="post();">Thread</button>`
    }

    let timeline = document.getElementById("timeline");

    let temp = "";
    for (let i = 0; i < items.length; i++) {
        let username = items[i]["username"];
        let pfp = items[i]["pfp"];
        let displayName = items[i]["display_name"];
        let content = items[i]["content"];
        let likes = items[i]["likes"];
        let attachment = items[i]["source"];
        let id = items[i]["id"];
        let replyTo = items[i]["reply_to"];
        let datePosted = items[i]["date_posted"];

        let likeDiv = "<p></p>";
        if (likes > 0) {
            likeDiv = "<p class=\"like_count\">" + likes + "</p>";
        }

        let attachmentDiv = "";
        if (attachment != "0") {
            attachmentDiv = `<img class="attachment" src="${attachment}" style="margin-bottom: 20px"></img>`;
        }

        let replyToDiv = "";
        if (replyTo != "None") {
            replyToDiv = `<a href="/profile/${replyTo}"><p style="display: inline-block; color: #606f91; margin-right: 5px">@${replyTo}</p></a>`;
        }

        temp += `<div class="tweet" onClick="redirect('/thread/${id}')">` +
            "<div class=\"tweet_content\">" +
                `<div class="tweet_profile_picture" style="margin-top: 10px; background-image: url(${pfp});" onClick="redirect('/profile/${username}')"></div>` +
                `<a href="/profile/${username}"><h2 style="display: inline-block; margin-left: 65px">${displayName}</h2></a>` +
                `<a href="/profile/${username}"><p style="display: inline-block; margin-left: 5px; font-size: 18px; color: grey">@${username}</p></a>` +

                "<div class=\"tweet_text\">" +
                    replyToDiv +
                    "<p style=\"display: inline-block\">" + content + "</p>" +
                "</div>" +

                "<div>" +
                    attachmentDiv +

                    "<div>" +
                        `<p style=\"color: grey\">${datePosted}</p>` +
                    "</div>" +

                    "<div>" +
                        `<img class="like" src="" onClick="doAddLike('${id}');"></img>` +
                        likeDiv +
                    "</div>" +
                "</div>" +
            "</div>" +
        "</div>"
    }
    timeline.innerHTML = temp;
}

const doAddLike = (id) => {
    load('/final/thread/' + id, addLike);
}

const addLike = (response) => {
    let data = JSON.parse(response);
    let thread = data["thread"];

    let likes = thread["likes"];
    let likedBy = thread["liked_by"];
    let id = thread["id"];

    let xhttp = new XMLHttpRequest();
    xhttp.onload = () => {
        if (xhttp.status == 200) {
            reload(xhttp.response);
        }
    }
    xhttp.open('POST', '/final/thread-addlike', true);
    var formData = new FormData();
    formData.append("likes", likes);
    formData.append("likedBy", likedBy);
    formData.append("id", id);

    xhttp.send(formData);
}

const uploadProfilePicture = () => {
    let pfp = document.getElementById('change_pfp').files[0];

    let xhttp = new XMLHttpRequest();
    xhttp.onload = () => {
        if (xhttp.status == 200) {
            reload(xhttp.response);
        }
    }
    xhttp.open('POST', '/final/uploadpfp', true);
    var formData = new FormData();
    formData.append("pfp", pfp);

    xhttp.send(formData);
}

const uploadBanner = () => {
    let banner = document.getElementById('change_banner').files[0];

    let xhttp = new XMLHttpRequest();
    xhttp.onload = () => {
        if (xhttp.status == 200) {
            reload(xhttp.response);
        }
    }
    xhttp.open('POST', '/final/uploadbanner', true);
    var formData = new FormData();
    formData.append("banner", banner);

    xhttp.send(formData);
}

const applyChanges = () => {
    let displayName = document.getElementById('change_display_name').value;
    let username = document.getElementById('change_username').value;
    let password = document.getElementById('change_password').value;

    let xhttp = new XMLHttpRequest();
    xhttp.onload = () => {
        if (xhttp.status == 200) {
            reload(xhttp.response);
        }
    }
    xhttp.open('POST', '/final/applychanges', true);
    var formData = new FormData();
    formData.append("display_name", displayName)
    formData.append("username", username)
    formData.append("password", password)

    xhttp.send(formData);
}

const post = () => {
    if (document.getElementById('home_tweet_content').value == '' && document.getElementById('attach_button').files[0] == undefined) {
        return;
    }
    let xhttp = new XMLHttpRequest();
    xhttp.onload = () => {
        if (xhttp.status == 200) {
            reload(xhttp.response);
        }
    }
    xhttp.open('POST', '/final/post', true);
    var formData = new FormData();
    formData.append("attachment", document.getElementById('attach_button').files[0]);
    formData.append("content", document.getElementById('home_tweet_content').value)

    xhttp.send(formData);
}

const doGetSuperPopMembers = () => {
    load('/final/members', getSuperPopMembers);
}

const getSuperPopMembers = (response) => {
    let data = JSON.parse(response);
    let members = data["members"];
    sortMembers(members);

    const miscellaneousDoc = document.getElementById('miscellaneous');

    let memberDiv = `<h2 style="margin-left: 30px;">Super popular accounts you might like:</h2>`;

    for (let i = 0; i < members.length; i++) {
        let username = members[i]["username"];
        let displayName = members[i]["display_name"];
        let pfp = members[i]["pfp"];

        memberDiv += `<div class="misc_content" onClick="redirect('/profile/${username}');">` +
                        `<div class="tweet_profile_picture" style="margin-top: 10px; background-image: url('${pfp}');"></div>` +
                        `<h2 style="display: inline-block; margin-left: 65px">${displayName}</h2>` +
                        `<p style="display: inline-block; margin-left: 5px; font-size: 18px; color: grey">@${username}</p>` +
                    `</div>`;

        if (i < members.length - 1) {
            memberDiv += "<div class=\"hor_line\"></div>";
        }
    }
    miscellaneousDoc.innerHTML = memberDiv;
}

const reload = (response) => {
    location.reload();
}

const sortThreads = (threads) => {
    threads.sort((thread1, thread2) => {
        let date1 = thread1.date_posted.split(',')[0];
        let date2 = thread2.date_posted.split(',')[0];

        if (date2 < date1) {
            return -1;
        } else if (date2 > date1) {
            return 1;
        } else {
            let time1 = thread1.date_posted.split(',')[1];
            let time2 = thread2.date_posted.split(',')[1];

            if (time2 < time1) {
                return -1;
            } else if (time2 > time1) {
                return 1;
            } else {
                return 0;
            }
        }
    });
}

const sortMembers = (members) => {
    members.sort((member1, member2) => {
        return parseInt(member2.engagement) - parseInt(member1.engagement);
    });
}