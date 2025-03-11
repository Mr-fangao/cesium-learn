import { encrypt, decrypt } from "./jsencrypt";
/**
 * @Author: dongnan
 * @Description: 存储cookie
 * @Date: 2022-05-14 18:25:31
 * @param {Any} key 键名
 * @param {Any} value 键值
 * @param {boolean} isEncrypt 是否加密
 */
export function setSession(key, value, isEncrypt = false) {
	if (isEncrypt) {
		sessionStorage.setItem(key, encrypt(value));
	} else {
		sessionStorage.setItem(key, value);
	}
}
/**
 * @Author: dongnan
 * @Description: 获取cookie
 * @Date: 2022-05-14 18:25:31
 * @param {Any} key 键名
 * @param {boolean} isEncrypt 是否加密
 */
export function getSession(key, isEncrypt = false) {
	let value = sessionStorage.getItem(key);
	if (value) {
		if (isEncrypt) {
			return decrypt(value);
		} else {
			return value;
		}
	}
}
/**
 * @Author: dongnan
 * @Description: 移除cookie
 * @Date: 2022-05-14 19:05:46
 * @param {Any} key 键名
 */
export function removeSession(key) {
	return sessionStorage.removeItem(key);
}
