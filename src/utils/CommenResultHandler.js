import { NoticeUtil } from "./NoticeUtil";

const checkRes = (res) => {
    if (res.data.code == "200") {
        return true;
    }
    // debugger
    NoticeUtil.error(res.data.msg || "位置错误");
    return false;
}

export { checkRes }