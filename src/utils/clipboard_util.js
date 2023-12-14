async function copyContentToClipboard(text) {
    if(navigator.clipboard){
        try {
            await navigator.clipboard.writeText(text);
            console.log('Text copied to clipboard');
        } catch (err) {
            console.error('Failed to copy: ', err);
        }
    }else{
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        console.log('文本已经复制到剪贴板中');
    }

}

export {
    copyContentToClipboard
};

