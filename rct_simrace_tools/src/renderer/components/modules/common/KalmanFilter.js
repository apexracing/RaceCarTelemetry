/**
 * 扩展卡尔曼过滤器参考文献:
	https://mathjs.org/docs/reference/functions.html
	https://zh.wikipedia.org/wiki/%E5%8D%A1%E5%B0%94%E6%9B%BC%E6%BB%A4%E6%B3%A2
	https://automaticaddison.com/extended-kalman-filter-ekf-with-python-code-example/#Real-World_Applications	
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
		
		this.I =math.identity(this.P_k._size[0]);
		//init
		this.x_k_ = this.x_k;
		this.P_k_ = this.P_k;

		//Predict
		this.x_k_k_ = math.multiply(this.F_k,this.x_k_);
		
		this.P_k_k_ = math.add(math.multiply(this.F_k,math.multiply(this.P_k_,math.transpose(this.F_k))),this.Q_k)
		
		//update
		this.y_k = math.subtract(o.z_k,math.multiply(o.H_k,this.x_k_k_));
		this.S_k = math.add(math.multiply(o.H_k,math.multiply(this.P_k_k_,math.transpose(o.H_k))),o.R_k);
		
		this.K_k =math.multiply(this.P_k_k_,math.multiply(math.transpose(o.H_k),math.inv(this.S_k)));
		
		this.x_k=math.add(this.x_k_k_,math.multiply(this.K_k,this.y_k))
		
		this.P_k=math.multiply(math.subtract(this.I,math.multiply(this.K_k,o.H_k)),this.P_k_k_);
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
