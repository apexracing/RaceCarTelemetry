export default {
	/** 判断两条直线是否有交点
	 * @param {Object} p1 线段1 起点
	 * @param {Object} p2 线段1 终点
	 * @param {Object} p3 线段2 起点
	 * @param {Object} p4 线段2 终点
	 */
	isIntersecting: function(p1, p2, p3, p4) {
		function CCW(p1, p2, p3) {
			return (p3.y - p1.y) * (p2.x - p1.x) > (p2.y - p1.y) * (p3.x - p1.x);
		}
		return (CCW(p1, p3, p4) != CCW(p2, p3, p4)) && (CCW(p1, p2, p3) != CCW(p1, p2, p4));
	},
	/**
	 * 计算两个坐标点角度
	 * @param {Object} dest
	 * @param {Object} near
	 */
	angle: function(dest, near) {
		return Math.atan2(dest.y - near.y, dest.x - near.x) * 180 / Math.PI;
	},
	/**在屏幕坐标系中，某点point绕点rotate_center旋转angle后的坐标
	 * @param {Object} row 图像高度
	 * @param {Object} point
	 * @param {Object} rotate_center
	 * @param {Object} angle
	 */
	getRotatePoint: function(row, point, rotate_center, angle) {
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

};
