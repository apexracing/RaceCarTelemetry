<template>
	<div class="root">
		<el-row type="flex" justify="space-around">
			<el-col :span="6">
				<el-card shadow="always" :body-style="{ padding: '0px' }" class="box-card">
					<img src="~@/assets/AssettoCorsa.png" class="image">
					<div style="padding: 10px;">
						<span>AssettoCorsa</span>
						<div class="bottom clearfix">
							<el-button type="primary" style="float: right;">启动</el-button>
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
							<el-button type="primary" style="float: right;">启动</el-button>
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
							<el-button type="primary" style="float: right;">打开</el-button>
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
		name: 'landing-page'
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
