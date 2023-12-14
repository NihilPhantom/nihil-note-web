const NoticeUtil = {
    success: function (message) {
        showMessage(message, "success");
    },
    warn: function (message) {
        showMessage(message, "warn");
    },
    error: function (message) {
        showMessage(message, "error");
    }
}

function showMessage(message, messageType) {

    // 向页面添加 弹窗的 css
    if (!document.getElementById('notice-util-style')) {
        let linkTag = document.createElement('link');
        linkTag.id = 'notice-util-style';
        linkTag.href = `/css/NoticeUtil.css`;
        linkTag.setAttribute('rel', 'stylesheet');
        linkTag.setAttribute('type', 'text/css');
        document.head.appendChild(linkTag);
    }

    const messageBox = document.createElement("div");
    messageBox.innerHTML = message;
    messageBox.classList.add("NoticeUtil");
    messageBox.classList.add(messageType);
    document.body.appendChild(messageBox);

    setTimeout(() => {
        messageBox.classList.add("fade-in");
    }, 200);

    setTimeout(() => {
        messageBox.classList.remove("fade-in");
        messageBox.classList.add("fade-out");
    }, 1000);

    setTimeout(() => {
        document.body.removeChild(messageBox);
    }, 1200);
}

export { NoticeUtil }