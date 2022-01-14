/**
 * 尔曼过滤器参考文献:
	https://mathjs.org/docs/reference/functions.html
	https://en.wikipedia.org/wiki/Kalman_filter
 */
import  * as math from 'mathjs'
class KalmanEKF{
	constructor(x_0,P_0,F_k,Q_k){
		    this.x_k  = x_0;
		    this.P_k  = P_0;
		    this.F_k  = F_k;
		    this.Q_k  = Q_k;
				//用于反向平滑
				this.A_x_k = [];
				this.A_P_k = [];
	}

	update(o){
		//引用https://en.wikipedia.org/wiki/Kalman_filter#Details算法
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
		this.A_x_k.push(this.x_k);
		this.A_P_k.push(this.P_k);
	}
	/**
	 * 向后平滑
	 */
	smooth(){
		/**
		 * 引用https://en.wikipedia.org/wiki/Kalman_filter#Rauch%E2%80%93Tung%E2%80%93Striebel算法
		 * 参考https://github.com/rlabbe/Kalman-and-Bayesian-Filters-in-Python/blob/master/13-Smoothing.ipynb
		 */
		for(var k=this.A_x_k.length-2;k>=0;k--){
			var P_k=this.A_P_k[k];
			var P_k_plus=this.A_P_k[k+1];
			var x_k=this.A_x_k[k];
			var x_k_plus=this.A_x_k[k+1];
			var P_k_k=math.add(math.multiply(math.multiply(this.F_k,P_k),math.transpose(this.F_k)),this.Q_k);
			var x_k_k=math.multiply(this.F_k,x_k);
			var C_k=math.multiply(math.multiply(P_k,math.transpose(this.F_k)),math.inv(P_k_k));
			this.A_x_k[k]=math.add(x_k,math.multiply(C_k,math.subtract(x_k_plus,x_k_k)));
			this.A_P_k[k]=math.add(P_k,math.multiply(math.multiply(C_k,math.subtract(P_k_plus,P_k_k)),math.transpose(C_k)));
		}
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
