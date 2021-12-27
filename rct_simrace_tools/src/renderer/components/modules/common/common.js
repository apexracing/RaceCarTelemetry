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
	}

};
