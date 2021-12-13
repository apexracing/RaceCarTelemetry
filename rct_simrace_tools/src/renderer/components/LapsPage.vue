<template>
	<div>
		<div class="info" :column="2">
			<el-descriptions>
				<el-descriptions-item label="Driver">nick</el-descriptions-item>
				<el-descriptions-item label="Car">AMG GT3</el-descriptions-item>
				<el-descriptions-item label="Track">XIC</el-descriptions-item>
			</el-descriptions>
		</div>
		<div class="info">
			<el-descriptions :column="5" size="mini" border>
				<el-descriptions-item label="speed">265km/h</el-descriptions-item>
				<el-descriptions-item label="throttle">%</el-descriptions-item>
				<el-descriptions-item label="brake">100%</el-descriptions-item>
				<el-descriptions-item label="clutch">55%</el-descriptions-item>
				<el-descriptions-item label="rpm">7200</el-descriptions-item>
				<el-descriptions-item label="gear">5</el-descriptions-item>
				<el-descriptions-item label="steer">32</el-descriptions-item>
				<el-descriptions-item label="G_V">1.5G</el-descriptions-item>
				<el-descriptions-item label="G_H">0.l8G</el-descriptions-item>
				<el-descriptions-item label="lapTime">1.45.323</el-descriptions-item>
			</el-descriptions>
		</div>

		<el-table :data="lapsData" style="width: 100%" height="250" border stripe>
			<el-table-column prop="lap" label="lap" width="80">
			</el-table-column>
			<el-table-column prop="s1" label="S1" width="120">
			</el-table-column>
			<el-table-column prop="s2" label="S2" width="120">
			</el-table-column>
			<el-table-column prop="s3" label="S3" width="120">
			</el-table-column>
			<el-table-column prop="laptime" label="laptime" width="180">
			</el-table-column>
		</el-table>

	</div>
</template>

<script>
	/* eslint-disable */
	import ACRemoteTelemetryClient from '@/components/modules/ac/ACRemoteTelemetryClient';
	import {
		Loading
	} from 'element-ui';

	export default {
		name: 'laps-page',
		mounted() {
			/* 	switch (this.$route.params.deviceId) {
					case 'ac':
						{
							this.loadingInstance = Loading.service({
								fullscreen: true,
								'text': 'connecting to assetto corsa,please start the game or check your firewall.'
							});
							this.start_ac()
							break;
						}
						case 'acc':
						{
							this.loadingInstance = Loading.service({
								fullscreen: true,
								'text': 'connecting to assetto corsa competizione'
							});
						}
				} */
		},
		data() {
			return {
				lapsData: [{
					lap: 1,
					laptime: '1.34.5',
					s1: 34.56,
					s2: 33.52,
					s3: 35.61
				}]
			}
		},
		methods: {
			start_ac() {
				const client = new ACRemoteTelemetryClient("localhost");

				// Implement desired listeners
				client.on('HANDSHAKER_RESPONSE', function(data) {
					this.loadingInstance.close();
					console.log("车手名:%s,赛道:%s,车型:%s", data.driverName.substr(0, data.driverName.indexOf('%')), data.trackName.substr(
						0, data.trackName.indexOf('%')), data.carName.substr(0, data.carName.indexOf('%')));
				});
				client.on('RT_LAP', (data) => console.log(data));

				// Start listening
				client.start();

				// Send initial handshake
				client.handshake();

				// Subscribe to desired updates
				//client.subscribeUpdate();
			}
		}
	}
</script>

<style>
	.info {
		box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
		padding: 15px;
	}
</style>
