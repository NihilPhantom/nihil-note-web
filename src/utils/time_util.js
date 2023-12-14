// --- 防 抖 器  ---
class Debouncer {
    constructor(delay , fn) {
        this.delay = delay
        this.fn = fn
        this.time = null
    }
    do() {
        let that = this
        return function () {
            if (that.time !== null) {
                clearTimeout(that.time);
            }
            that.time = setTimeout(() => {
                that.fn.call(this);  //  利用call(),让this的指针从指向window 转成指向input
            }, that.delay)
        }
    }
}

class TimerUtil {
    /**
     * 注册一个防抖器
     * @param {*} id 防抖器id， 推荐使用 "Db_xxxx"
     * @param {*} delay 两次函数触发最小间隔
     * @param {*} fn 要被做抖动限制的函数
     * @returns 
     */
    static registerDebounce = function (id, delay, fn) {
        if (TimerUtil.debounces.hasOwnProperty(id)){
            TimerUtil.doDebounce(id)
            return
        }
        TimerUtil.debounces[id] = new Debouncer(delay, fn)
    }

    /**
     * 执行防抖器的函数，在执行时，使用该方法执行的函数会按照注册时的时间，进行防抖
     * @param {*} id 防抖器id 
     */
    static doDebounce = function(id){
        if (TimerUtil.debounces.hasOwnProperty(id)){
            TimerUtil.debounces[id].do()()
        }
    }
}

// ---  存放防抖器，  ---
// - {
//   id : Debouncer
// }
TimerUtil.debounces = {}

export default TimerUtil;