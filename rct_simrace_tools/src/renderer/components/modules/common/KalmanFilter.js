/**
 * 扩展卡尔曼过滤器参考文献:
	https://mathjs.org/docs/reference/functions.html
	https://zh.wikipedia.org/wiki/%E5%8D%A1%E5%B0%94%E6%9B%BC%E6%BB%A4%E6%B3%A2
	https://automaticaddison.com/extended-kalman-filter-ekf-with-python-code-example/#Real-World_Applications
	输入向量:速度=V,航向=H，加速度=A[V_dt2-V_dt1)/dt] 状态向量:横向加速度=LAT_ACC，纵向加速度=LONG_ACC,倾角=LEAN_ANGLE
	时间差=dt
	公式1:R=V/w(V是切向速度(米/秒),w是heading计算出的角速度(弧度/秒),R半径(米))
	LAT_ACC=V²/R/G (G=9.80665)
	LONG_ACC=A/dt/G (A是速度差,dθ时差)
	LEAN_ANGLE=ARCTAN(LAT_ACC)*180/PI
	
	1.建立状态模型 
	
	2.建立观查模型
	
 */
import  * as math from 'mathjs'
class KalmanEKF{
	constructor(x_0,P_0,F_k,Q_k){
		    this.x_k  = x_0;
		    this.P_k  = P_0;
		    this.F_k  = F_k;
		    this.Q_k  = Q_k;
	}
	update(o){
		this.I =math.identity(this.P_k.rows());
		//init
		this.x_k_ = this.x_k;
		this.P_k_ = this.P_k;

		//Predict
		this.x_k_k_ = math.multiply(this.F_k,this.x_k_);
		this.P_k_k_ = this.F_k.x(this.P_k_.x(this.F_k.transpose())) .add(this.Q_k);
		
		//update
		this.y_k = o.z_k.subtract(o.H_k.x(this.x_k_k_));//observation residual
		this.S_k = o.H_k.x(this.P_k_k_.x(o.H_k.transpose())).add(o.R_k);//residual covariance
		this.K_k = this.P_k_k_.x(o.H_k.transpose().x(this.S_k.inverse()));//Optimal Kalman gain
		this.x_k = this.x_k_k_.add(this.K_k.x(this.y_k));
		this.P_k = this.I.subtract(this.K_k.x(o.H_k)).x(this.P_k_k_);
	}
}
class KalmanObservation{
	constructor(z_k,H_k,R_k){
		this.z_k = z_k;//observation
		this.H_k = H_k;//observation model
		this.R_k = R_k;//observation noise covariance
	}
}

export{
	KalmanEKF,
	KalmanObservation
}
