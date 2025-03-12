/**
 * Created by wqy
 * Date 2023/3/30 17:04
 * Description 单例化全局状态管理
 */
import Bus from './eventBus'
export class GlobalState{
	constructor() {
		this.instance = null;
		this.viewer=null;

		// 因为有的数据获取一次但是要在很多不同地方加载，
        // 比如行政区划region_grid和region_onemap都是获取接口中城镇数据，
		// 所以定义了下面这个变量存储获取一次的json，第二次加载的时候不需要再次获取json了
		this.resdata={
			river:null,
			region:null,
			gridwall:null,
		}

		//记录easyplayer所有信息，包括登录，axios和httprequest拦截信息，整个程序只用赋值一次，
		//也就是任意一个realtimevideoCom第一次初始化的时候
		this.easyPlayerEncase=null;
	}
	static getInstance() {
		if (!this.instance) {
			this.instance = new GlobalState();
		}
		return this.instance;
	}


}

export function formatDateTime(date) {
	date=new Date(date);
	const year = date.getFullYear();
	const month = date.getMonth() + 1;
	const day = date.getDate();
	const hour = date.getHours();
	const minute = date.getMinutes();
	const second = date.getSeconds();
	return `${year}-${pad(month)}-${pad(day)} ${pad(hour)}:${pad(minute)}:${pad(second)}`;
}
function pad(num) { return num.toString().padStart(2, '0')}






