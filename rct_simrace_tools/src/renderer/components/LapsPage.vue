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
					<div id="track_map" width="400" height="400"></div>
				</el-col>
			</el-row>
		</div>
		<span>&nbsp;</span>
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
		Loading
	} from 'element-ui';
	const {
		dialog
	} = require('electron').remote;

	import * as d3 from 'd3/dist/d3.min'

	export default {
		name: 'laps-page',
		data() {
			return {
				vob_column: [],
				vob_data: [],
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
						this.$data.realtime_show = true;
						if (this.$data.vob_column.length > 0) {
							break;
						}
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
			//分析vbo文件
			process_vob(file, loading) {
				console.log('正在分析VBO文件:' + file)
				var fs = require('fs');
				var readline = require('readline');
				var fRead = fs.createReadStream(file);
				var objReadline = readline.createInterface({
					input: fRead
				});

				var section = "";
				objReadline.on('line', (line) => {
					if (line.startsWith("[")) {
						section = line;
					} else if (line.length > 0) {
						if (section == "[column names]") {
							this.vob_column = line.trim().split(" ");
						}
						if (section == "[data]") {
							var vob_row = line.trim().split(" ");
							var vob_row_data = {};
							for (var i in vob_row) {
								var column_name = this.vob_column[i];
								vob_row_data[column_name] = parseFloat(vob_row[i]);
							}
							this.vob_data.push(vob_row_data);
						}
					}
				});
				objReadline.on('close', () => {
					this.analyse_vob();
					console.log("VOB文件分析完成")
					//console.log(this.vob_column);
					//console.log(this.vob_data);
					loading.close();
				});
			},
			/**
			 * 分析VOB
			 * 算法1:取中间三分之一GPS平均坐标，与服务器赛道平均坐标对比，自动匹配赛道起点和分段
			 * 算法2:服务器没有的赛道，取最高速度作为默认起点，用户可通过滑动条 修改“起点/终点”。
			 */
			analyse_vob() {
				var margin = {
						top: 10,
						right: 20,
						bottom: 10,
						left: 20
					},
					width = 400 - margin.left - margin.right,
					height = 400 - margin.top - margin.bottom;

				var svg = d3.select("#track_map").append("svg")
					.attr("width", width + margin.left + margin.right)
					.attr("height", height + margin.top + margin.bottom)
					.append("g")
					.attr("transform",
						"translate(" + margin.left + "," + margin.top + ")");
				var xscl = d3.scaleLinear()
					.domain(d3.extent(this.vob_data, function(d) {
						return d.lat;
					})) //use just the x part
					.range([0, width])

				var yscl = d3.scaleLinear()
					.domain(d3.extent(this.vob_data, function(d) {
						return d.long;
					})) // use just the y part
					.range([height, 0])


				svg.append("path")
					.datum(this.vob_data)
					.attr("fill", "none")
					.attr("stroke", "green")
					.attr("stroke-width", 2)
					.attr("d", d3.line()
						.x(function(d) {
							return xscl(d.lat);
						}) // apply the x scale to the x data
						.y(function(d) {
							return yscl(d.long);
						}))


				//this.$data.track_map[0].y = this.vob_data["long"]; //第一层地图数据，第二层赛道trigger
				var max_speed = this.vob_data.reduce(function(prev, current) {
					return (prev.velocity > current.velocity) ? prev : current
				}) //returns object
				console.log("最高速度:" + max_speed.velocity)
				//计算赛道“起/终点”

				//计算单圈数据

				//取最快圈做为赛道预览图

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
