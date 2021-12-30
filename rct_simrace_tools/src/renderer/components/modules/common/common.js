import * as d3 from 'd3/dist/d3'

class common {
	/** 判断两条直线是否有交点
	 * @param {Object} p1 线段1 起点
	 * @param {Object} p2 线段1 终点
	 * @param {Object} p3 线段2 起点
	 * @param {Object} p4 线段2 终点
	 * @return {Object} 不相交返回false，或返回交点p;
	 */
	static isIntersecting(p1, p2, p3, p4) {
		function CCW(p1, p2, p3) {
			var A = (p3.y - p1.y) * (p2.x - p1.x);
			var B = (p2.y - p1.y) * (p3.x - p1.x);
			return (A > B + Number.EPSILON) ? 1 : (A + Number.EPSILON < B) ? -1 : 0;
		}
		if ((CCW(p1, p3, p4) != CCW(p2, p3, p4)) && (CCW(p1, p2, p3) != CCW(p1, p2, p4))) {
			var denominator = (p2.y - p1.y) * (p4.x - p3.x) - (p1.x - p2.x) * (p3.y - p4.y);
			var x = ((p2.x - p1.x) * (p4.x - p3.x) * (p3.y - p1.y) +
				(p2.y - p1.y) * (p4.x - p3.x) * p1.x -
				(p4.y - p3.y) * (p2.x - p1.x) * p3.x) / denominator;
			var y = -((p2.y - p1.y) * (p4.y - p3.y) * (p3.x - p1.x) +
				(p2.x - p1.x) * (p4.y - p3.y) * p1.y -
				(p4.x - p3.x) * (p2.y - p1.y) * p3.y) / denominator;
			return {
				x: x,
				y: y
			}
		}
		return false;
	}
	/**
	 * 计算两个坐标点角度
	 * @param {Object} dest
	 * @param {Object} near
	 */
	static angle(dest, near) {
		return this.toDegrees(Math.atan2(dest.y - near.y, dest.x - near.x));
	}
	/**角度转弧度
	 * @param {Object} n
	 */
	static toRadians(d) {
		if (isNaN(d)) throw new TypeError(`invalid degress ‘${d}’`);
		return d * Math.PI / 180.0;
	}
	/**弧度转角度
	 * @param {Object} n
	 */
	static toDegrees(r) {
		if (isNaN(r)) throw new TypeError(`invalid radian ‘${r}’`);
		return r * 180.0 / Math.PI;
	}
	/**在屏幕坐标系中，某点point绕点rotate_center旋转angle后的坐标
	 * @param {Object} row 图像高度
	 * @param {Object} point
	 * @param {Object} rotate_center
	 * @param {Object} angle
	 */
	static getRotatePoint(row, point, rotate_center, angle) {
		var x1 = point.x;
		var y1 = row - point.y;
		var x2 = rotate_center.x;
		var y2 = row - rotate_center.y;
		var x = (x1 - x2) * Math.cos(Math.PI / 180.0 * angle) - (y1 - y2) * Math.sin(Math.PI / 180.0 * angle) + x2;
		var y = (x1 - x2) * Math.sin(Math.PI / 180.0 * angle) + (y1 - y2) * Math.cos(Math.PI / 180.0 * angle) + y2;
		y = row - y;
		return {
			x: x,
			y: y
		};
	}
	/**
	 * 线性插值计算
	 * @param {Object} x
	 * @param {Object} x_arr
	 * @param {Object} y_arr
	 */
	static lineInterpolationInvert(x, x_arr, y_arr) {
		if(x_arr[1]<=x_arr[0]) throw new TypeError(`invalid x_arr ‘${x_arr[1]}<=${x_arr[0]}’`)
		if (isNaN(x)) return null;
		if (!Array.isArray(x_arr) || x_arr.length != 2) throw new TypeError(`invalid x_arr ‘${x_arr}’`);
		if (!Array.isArray(y_arr) || y_arr.length != 2) throw new TypeError(`invalid x_arr ‘${y_arr}’`);
		return ((x_arr[1] - x) / (x_arr[1] - x_arr[0])) * y_arr[0] + ((x - x_arr[0]) / (x_arr[1] - x_arr[0])) * y_arr[1];
	}
	/**
	 * 离群算法，去除G力嗓点3sigma法
	 */
	static three_sigma(dataset,field,n=3){
		//均值
		var mean=d3.mean(dataset,(d)=>d[field]);
		//全局标准差
		var sigma =d3.deviation(dataset,(d)=>d[field]);
		console.log(mean)
		var newDataset=dataset.filter(function(d){
			return Math.abs(d[field] - mean) > n * sigma
		});
		return newDataset;
	}
}
class gps_utils {
	//以下函数参考http://www.movable-type.co.uk/scripts/latlong.html
	static wrap90(degrees) {
		if (-90 <= degrees && degrees <= 90) return degrees; // avoid rounding due to arithmetic ops if within range

		// latitude wrapping requires a triangle wave function; a general triangle wave is
		//     f(x) = 4a/p ⋅ | (x-p/4)%p - p/2 | - a
		// where a = amplitude, p = period, % = modulo; however, JavaScript '%' is a remainder operator
		// not a modulo operator - for modulo, replace 'x%n' with '((x%n)+n)%n'
		const x = degrees,
			a = 90,
			p = 360;
		return 4 * a / p * Math.abs((((x - p / 4) % p) + p) % p - p / 2) - a;
	}
	/**
	 * Constrain degrees to range -180..+180 (for longitude); e.g. -181 => 179, 181 => -179.
	 *
	 * @private
	 * @param {number} degrees
	 * @returns degrees within range -180..+180.
	 */
	static wrap180(degrees) {
		if (-180 <= degrees && degrees <= 180) return degrees; // avoid rounding due to arithmetic ops if within range

		// longitude wrapping requires a sawtooth wave function; a general sawtooth wave is
		//     f(x) = (2ax/p - p/2) % p - a
		// where a = amplitude, p = period, % = modulo; however, JavaScript '%' is a remainder operator
		// not a modulo operator - for modulo, replace 'x%n' with '((x%n)+n)%n'
		const x = degrees,
			a = 180,
			p = 360;
		return (((2 * a * x / p - p / 2) % p) + p) % p - a;
	}
	/** 将vbo文件中的MMMMM.MMMMM格式转成十进制地图经纬度坐标
	 * @param {Object} mmm  
	 */
	static convertLatLngToDecimal({
		lat,
		long
	}) {
		if (isNaN(lat)) return null;
		if (typeof lat == 'string' && lat.trim() == '') return null;
		if (typeof lat == 'boolean') return null;
		if (lat == Infinity) return null;
		if (lat == null) return null;
		if (isNaN(long)) return null;
		if (typeof long == 'string' && long.trim() == '') return null;
		if (typeof long == 'boolean') return null;
		if (long == Infinity) return null;
		if (long == null) return null;
		return {
			lat: gps_utils.wrap90(lat / 60),
			long: gps_utils.wrap180(long / 60)
		};
	}

	/**
	 * 两个经纬度坐标距离,单位(米)
	 */
	static distanceTo(point1, point2, radius = 6378137) {
		const R = radius;
		const φ1 = common.toRadians(point1.lat),
			λ1 = common.toRadians(point1.long);
		const φ2 = common.toRadians(point2.lat),
			λ2 = common.toRadians(point2.long);
		const Δφ = φ2 - φ1;
		const Δλ = λ2 - λ1;
		const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
		const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
		const d = R * c;
		return d;
	}
	/**
	 * 从某点出发向指定方向移动指定距离后的经纬度坐标
	 * @param   {number} distance - 移动距离.米.
	 * @param   {number} bearing - 方位：从北极开始计算的角度.
	 * @param   {number} [radius=6371e3] - (Mean) radius of earth (defaults to radius in metres).
	 * @returns {LatLon} Destination point.
	 *
	 * @example
	 *   const p1 = {lat:51.47788, long:-0.00147};
	 *   const p2 = destinationPoint(p1,7794, 300.7); // 51.5136°N, 000.0983°W
	 */
	static destinationPoint(point, distance, bearing, radius = 6378137) {
		const δ = distance / radius; // angular distance in radians
		const θ = common.toRadians(bearing);

		const φ1 = common.toRadians(point.lat),
			λ1 = common.toRadians(point.long);

		const sinφ2 = Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(θ);
		const φ2 = Math.asin(sinφ2);
		const y = Math.sin(θ) * Math.sin(δ) * Math.cos(φ1);
		const x = Math.cos(δ) - Math.sin(φ1) * sinφ2;
		const λ2 = λ1 + Math.atan2(y, x);

		const lat = common.toDegrees(φ2);
		const lon = common.toDegrees(λ2);

		return {
			lat: lat,
			long: lon
		};
	}

}
export {
	common,
	gps_utils
};
