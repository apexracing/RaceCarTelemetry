<template>
	<div class="root">
		<el-row type="flex" justify="space-around">
			<el-col :span="6">
				<el-card shadow="always" :body-style="{ padding: '0px' }" class="box-card">
					<img src="~@/assets/AssettoCorsa.png" class="image">
					<div style="padding: 10px;">
						<span>AssettoCorsa</span>
						<div class="bottom clearfix">
							<el-button type="primary" style="float: right;" @click="start_ac()">启动</el-button>
						</div>
					</div>
				</el-card>
			</el-col>
			<el-col :span="6">
				<el-card shadow="always" :body-style="{ padding: '0px' }" class="box-card">
					<img src="~@/assets/AssettoCorsaCompetition.png" class="image">
					<div style="padding: 10px;">
						<span>AssettoCorsaCompetition</span>
						<div class="bottom clearfix">
							<el-button type="primary" style="float: right;"  @click="start_acc()">启动</el-button>
						</div>
					</div>
				</el-card>
			</el-col>
			<el-col :span="6">
				<el-card shadow="always" :body-style="{ padding: '0px' }" class="box-card">
					<img src="~@/assets/vob_device.png" class="image">
					<div style="padding: 10px;">
						<span>GpsDevices</span>
						<div class="bottom clearfix">
							<el-button type="primary" style="float: right;"  @click="start_vob()">打开</el-button>
						</div>
					</div>
				</el-card>
			</el-col>
		</el-row>
	</div>
</template>

<script>
	/* eslint-disable */

	export default {
		name: 'landing-page',
		methods: {
			start_ac() {
				this.$router.push('/laps-page/ac')
			},
			start_acc() {
				this.$router.push('/laps-page/acc')
			},
			start_vob(){
			/* 	
			import {KalmanEKF,KalmanObservation} from '@/components/modules/common/KalmanFilter'
			import * as math from 'mathjs'
			
				var x_0 = math.matrix([[0.4],[0.8],[0]]);
				var P_0 = math.matrix([[1,0,0],[0,1,0],[0,0,1]]);
				var F_k=math.matrix([[1,0,0],[0,1,0],[0,0,1]]);
				var Q_k=math.matrix([[1,0,0],[0,1,0],[0,0,1]]);
				var KM = new KalmanEKF(x_0,P_0,F_k,Q_k);
				
				var z_k = math.matrix([[0.4],[0.8],[0]]);
				var H_k = math.matrix([[1,0,0],[0,1,0],[0,0,1]]);
				var R_k = math.matrix([[2,0,0],[0,2,0],[0,0,2]]);
				var KO = new KalmanObservation(z_k,H_k,R_k);
				
				for (var i=0;i<200;i++){
				  z_k = math.matrix([[0.4+0.1],[0.8+0.1],[0]]);
				  KO.z_k=z_k;
				  KM.update(KO);
				  console.log(KM.x_k.toString());
				} */
				this.$router.push('/laps-page/vob')
			}
		}
	}
	
</script>

<style>
	body {
		padding: 0rem;
	}

	.bottom {
		margin-top: 13px;
		line-height: 12px;
	}

	.image {
		width: 100%;
		display: block;
	}

	.clearfix:before,
	.clearfix:after {
		display: table;
		content: "";
	}

	.clearfix:after {
		clear: both
	}

	.box-card {
		width: 233px;
	}
</style>
