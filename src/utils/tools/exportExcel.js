// 依赖 xlsx
import * as XLSX from "xlsx";
function sheetBlob(sheet, sheetName) {
	sheetName = sheetName || "sheet1";
	let workbook = {
		SheetNames: [sheetName],
		Sheets: {},
	};
	workbook.Sheets[sheetName] = sheet;
	// 生成excel的配置项
	let wopts = {
		bookType: "xlsx", // 要生成的文件类型
		bookSST: false, // 是否生成Shared String Table，官方解释是，如果开启生成速度会下降，但在低版本IOS设备上有更好的兼容性
		type: "binary",
	};
	let wbout = XLSX.write(workbook, wopts);
	let blob = new Blob([s2ab(wbout)], {
		type: "application/octet-stream",
	});
	// 字符串转ArrayBuffer
	function s2ab(s) {
		if (typeof ArrayBuffer !== "undefined") {
			var buf = new ArrayBuffer(s.length);
			var view = new Uint8Array(buf);
			for (var i = 0; i != s.length; ++i) view[i] = s.charCodeAt(i) & 0xff;
			return buf;
		} else {
			var buf = new Array(s.length);
			for (var i = 0; i != s.length; ++i) buf[i] = s.charCodeAt(i) & 0xff;
			return buf;
		}
	}
	return blob;
}
// 导出excel
// data [[经度，维度，高度,null],[118.22，32.21，10，null]]
// name 文件名
// cols [{wch: 30}]
export function export2Excel(data, name, cols = []) {
	let sheet = XLSX.utils.aoa_to_sheet(data);
	sheet["!cols"] = cols;
	downloadExcel(sheetBlob(sheet), name);
}
// 下载excel
export function downloadExcel(url, saveName) {
	if (typeof url === "object" && url instanceof Blob) {
		url = URL.createObjectURL(url); // 创建blob地址
	}
	let aLink = document.createElement("a");
	aLink.href = url;
	aLink.download = saveName || ""; // HTML5新增的属性，指定保存文件名，可以不要后缀，注意，file:///模式下不会生效
	let event;
	if (window.MouseEvent) event = new MouseEvent("click");
	else {
		event = document.createEvent("MouseEvents");
		event.initMouseEvent("click", true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
	}
	aLink.dispatchEvent(event);
}
