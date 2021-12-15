<template>
	<div>
		<div class="info">
			<el-row type="flex" align="middle">
				<el-col :span="12">
					<el-descriptions>
						<el-descriptions-item label="Driver">nick</el-descriptions-item>
						<el-descriptions-item label="Car">AMG GT3</el-descriptions-item>
						<el-descriptions-item label="Track">XIC</el-descriptions-item>
					</el-descriptions>
					<el-descriptions :column="2" border v-if="realtime_show">
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
				</el-col>
				<el-col :span="12">
					<Plotly :data="track_map" :layout="layout" :display-mode-bar="false" :staticPlot="true"></Plotly>
				</el-col>
			</el-row>
		</div>
		<el-table :data="lapsData" style="width: 100%" height="250" border stripe>
			<el-table-column prop="lap" label="lap" width="80">
			</el-table-column>
			<el-table-column prop="topspeed" label="topspeed" width="180">
			</el-table-column>
			<el-table-column prop="lowspeed" label="lowspeed" width="180">
			</el-table-column>
			<el-table-column prop="s1" label="S1" width="120" v-if="sector_show">
			</el-table-column>
			<el-table-column prop="s2" label="S2" width="120" v-if="sector_show">
			</el-table-column>
			<el-table-column prop="s3" label="S3" width="120" v-if="sector_show">
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
		Plotly
	} from 'vue-plotly'
	import {
		Loading
	} from 'element-ui';
	const {
		dialog
	} = require('electron').remote;


	export default {
		name: 'laps-page',
		components: {
			Plotly
		},
		data() {
			return {
				track_map: [{
					x: [1, 2, 3, 4],
					y: [10, 15, 13, 17],
					type: "scatter"
				}],
				layout: {
					width: 400,
					height: 400,
					margin:{r:50,t:50,l:50,b:50},
					borderwidth:1,
					showlegend: false,
					title: "Track Map",
					xaxis: {
						showline: false,
						showgrid: false,
						zeroline: false,
						showticklabels: false,
					},
					yaxis: {
						showline: false,
						showgrid: false,
						zeroline: false,
						showticklabels: false
					}
				},
				realtime_show: true,
				sector_show: false,
				lapsData: [{
					lap: 1,
					laptime: '1.34.5',
					topspeed: 256,
					lowspeed: 86,
					s1: 34.56,
					s2: 33.52,
					s3: 35.61
				}]
			}
		},
		mounted() {
			switch (this.$route.params.deviceId) {
				case 'ac':
					{
						this.loadingInstance = Loading.service({
							fullscreen: true,
							'text': 'connecting to assetto corsa,please start the game or check your firewall.'
						});
						this.$data.sector_show = false;
						this.start_ac();
						break;
					}
				case 'acc':
					{
						this.$data.sector_show = true;

						this.loadingInstance = Loading.service({
							fullscreen: true,
							'text': 'connecting to assetto corsa competizione'
						});
						this.start_acc();
						break;
					}
				case 'vob':
					{
						this.$data.info_show = false;
						this.$data.realtime_show = false;
						this.loadingInstance = Loading.service({
							fullscreen: true,
							'text': 'please select an vbo file to import'
						});
						var selectFilePath = dialog.showOpenDialog({
							title: 'vob文件选择',
							defaultPath: '',
							filters: [{
								name: 'vbo',
								extensions: ['vbo']
							}]
						});
						this.loadingInstance.close();
						this.loadingInstance = Loading.service({
							fullscreen: true,
							'text': 'busy analyse vbo file,please wait...'
						});
						this.process_vob(selectFilePath[0], this.loadingInstance);
						break;
					}
			}
		},

		methods: {
			process_vob(file, loading) {
				console.log('正在分析文件:' + file)
				var fs = require('fs');
				var readline = require('readline');
				var fRead = fs.createReadStream(file);
				var objReadline = readline.createInterface({
					input: fRead
				});
				var vob_data = {};
				var vob_column = [];
				var section = "";
				objReadline.on('line', function(line) {
					if (line.startsWith("[")) {
						section = line;
					} else if (line.length > 0) {
						if (section == "[column names]") {
							vob_column = line.trim().split(" ");
							for (var i in vob_column) {
								var column_name = vob_column[i];
								vob_data[column_name] = new Array();
							}
							console.log(vob_data)
						}
						if (section == "[data]") {
							var vob_row = line.trim().split(" ");
							for (var i in vob_row) {
								var column_name = vob_column[i];
								vob_data[column_name].push(vob_row[i]);
							}
						}
					}
				});
				objReadline.on('close', () => {
					loading.close();
					this.$data.track_map[0].x = vob_data["lat"];
					this.$data.track_map[0].y = vob_data["long"];
				});
			},
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
			},
			start_acc() {

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
