import {ElMessage, ElNotification, ElLoading , ElMessageBox} from 'element-plus'


/**
 * 消息提示
 * @param {string} type 主题 success/warning/info/error
 * @param {string} msg 消息文字
 * @param {boolean} center 文字是否居中
 * @param {boolean} showClose 是否显示关闭按钮
 * @param {number} duration 显示时间, 默认1000毫秒。设为 0 则不会自动关闭
 */
function messagePrompt(type = 'info', msg = '', center = true, showClose = false, duration = 1000) {
	return ElMessage({
		type: type,
		message: msg,
		center: center,
		showClose: showClose,
		duration: duration
	});
}

/**
 * 通知提示
 * @param {string} title 标题
 * @param {string} msg 说明文字
 * @param {string} type 主题样式 success/warning/info/error
 * @param {number} offset 偏移距离
 * @param {string} position 弹出位置 top-right/top-left/bottom-right/bottom-left
 * @param {number} duration 显示时间 默认3000毫秒
 * @param {boolean} showClose 是否显示关闭按钮
 */
function notifyPrompt(title = '提示', msg = '', type = 'info', offset = 0, position = 'top-right', duration = 3000, showClose = true) {
	ElNotification({
		title: title,
		message: msg,
		type: type,
		offset: offset,
		position: position,
		duration: duration,
		showClose: showClose
	});
}

/**
 * 加载提示
 * @param {string} text 显示在加载图标下方的加载文案
 * @param {boolean} lock 是否锁定屏幕的滚动
 * @param {string} spinner 自定义加载图标类名
 * @param {string} background 遮罩背景色
 * @param {boolean} fullscreen 是否全屏
 */
function loadingPrompt(text = '', lock = true, spinner = 'el-icon-loading', background = 'rgba(0, 0, 0, 0.7)', fullscreen = true) {
	let loadingInstance = ElLoading .service({
		text: text,
		lock: lock,
		spinner: spinner,
		background: background,
		fullscreen: fullscreen
	});
	return loadingInstance;
}

/**
 * 信息确认框
 * @param content 内容
 * @param title 标题
 * @param confirmButtonText 确认按钮文本
 * @param cancelButtonText 取消按钮文本
 * @param confirmCallBack 确认回调函数
 * @param cancelCallBack 取消回调函数
 */
function messageBoxConfirm(content = '', title = '提示',confirmButtonText = '确定', cancelButtonText = '取消', confirmCallBack, cancelCallBack,customcalss='') {
	ElMessageBox.confirm(content, title, {
		confirmButtonText: confirmButtonText,
		cancelButtonText: cancelButtonText,
		customClass:customcalss,
		type: 'warning'
	}).then(function (res) {
		if(confirmCallBack){
			confirmCallBack(res);
		}
	}).catch(function (err) {
		if(cancelCallBack){
			cancelCallBack(err);
		}
	});
}

/**
 * 创建提示框
 * @param frameDiv
 * @returns {tooltip}
 */
function createTooltip(frameDiv) {
	let tooltip = function (frameDiv) {
		let div = document.createElement('DIV');
		div.className = "twipsy right";
		let arrow = document.createElement('DIV');
		arrow.className = "twipsy-arrow";
		div.appendChild(arrow);
		let title = document.createElement('DIV');
		title.className = "twipsy-inner";
		div.appendChild(title);
		this._div = div;
		this._title = title;
		this.message = '';
		// add to frame div and display coordinates
		frameDiv.appendChild(div);
		let that = this;
		div.onmousemove = function (evt) {
			that.showAt({x: evt.clientX, y: evt.clientY}, that.message);
		};
	};

	tooltip.prototype.setVisible = function (visible) {
		this._div.style.display = visible ? 'block' : 'none';
	};

	tooltip.prototype.showAt = function (position, message) {
		if (position && message) {
			this.setVisible(true);
			this._title.innerHTML = message;
			this._div.style.left = position.x + 10 + "px";
			this._div.style.top = (position.y - this._div.clientHeight / 2) + "px";
			this.message = message;
		}
	};

	return new tooltip(frameDiv);
}


export default {
	messagePrompt,
	notifyPrompt,
	loadingPrompt,
	messageBoxConfirm,
	createTooltip
}
