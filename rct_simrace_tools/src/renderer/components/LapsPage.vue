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
					<div id="track_map">
						<svg width="400" height="400">
							<g></g>
						</svg>
					</div>
				</el-col>
			</el-row>
		</div>
		<div class="play">
			<el-row>
				<el-col :span="8">
					<el-row align="middle" type="flex" justify="start">
						<el-col :span="8">
							<el-button type="primary" circle icon="el-icon-video-play"></el-button>
						</el-col>
						<el-col :span="4">
							<el-button circle icon="el-icon-d-arrow-left"></el-button>
						</el-col>
						<el-col :span="4">
							<el-button type="text" circle style="color:#303133;font-size: large;">0x</el-button>
						</el-col>
						<el-col :span="4">
							<el-button circle icon="el-icon-d-arrow-right"></el-button>
						</el-col>
					</el-row>
				</el-col>
				<el-col :span="16">
					<el-slider v-model="trackerPlayer"></el-slider>
				</el-col>
			</el-row>
		</div>
		<el-table :data="lapsData" style="width: 100%" height="200" border stripe class="table">
			<el-table-column prop="lap" label="lap" width="80">
			</el-table-column>
			<el-table-column prop="s1" label="S1" width="120" v-if="sector_show">
			</el-table-column>
			<el-table-column prop="s2" label="S2" width="120" v-if="sector_show">
			</el-table-column>
			<el-table-column prop="s3" label="S3" width="120" v-if="sector_show">
			</el-table-column>
			<el-table-column prop="laptime" label="laptime" width="120">
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

	import * as d3 from 'd3/dist/d3'

	export default {
		name: 'laps-page',
		data() {
			return {
				trackerPlayer: 0,
				triggers: [],
				trigger_id: 0,
				vob_column: [],
				vob_data: [],
				realtime_show: true,
				sector_show: false,
				lapsData: []
			}
		},
		created() {
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
						this.$data.sector_show =false;
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
					console.log("VOB文件分析完成")
					this.render_track();
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
			render_track() {
				var margin = {
						top: 20,
						right: 20,
						bottom: 20,
						left: 20
					},
					width = 400 - margin.left - margin.right,
					height = 400 - margin.top - margin.bottom;
				var svg = d3.select("#track_map svg")
					.attr("width", width + margin.left + margin.right)
					.attr("height", height + margin.top + margin.bottom)
				var g = svg.select("g")
					.attr("transform",
						"translate(" + margin.left + "," + margin.top + ")");
				function handleZoom(e) {
					d3.select('#track_map svg g')
						.attr('transform', e.transform);
				}
				let zoom = d3.zoom()
					.scaleExtent([1, 5])
					.translateExtent([
						[0, 0],
						[width, height]
					]).on("zoom", handleZoom);
				d3.select("#track_map svg").call(zoom);
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


				var path = g.append("path")
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
				//计算赛道“起/终点”

				var max_idx = d3.scan(this.vob_data, function(a, b) {
					return b.velocity - a.velocity
				});
				var auto_trigger = this.vob_data[max_idx];
				this.add_trigger_in_path([xscl(auto_trigger.lat), yscl(auto_trigger.long)]);
				//计算单圈数据
				path.on("click", (e, d) => {
					var pointer = d3.pointer(e);
					this.add_trigger_in_path(pointer);

				});
				//取最快圈做为赛道预览图

			},
			add_trigger_in_path(point) {
				var node = d3.select("path").node();
				var pathLen = node.getTotalLength();
				var distanceall = [];
				//粗略查询
				for (var i = 0; i < pathLen; i += 20) {
					var dest = node.getPointAtLength(i);
					var dx = dest.x - point[0];
					var dy = dest.y - point[1];
					var distance = dx * dx + dy * dy;
					distanceall.push({
						'distance': distance,
						'idx': i
					});
				}
				var clickIdx = distanceall[d3.minIndex(distanceall, d => d.distance)].idx;
				//精细查找
				distanceall = [];
				for (var i = clickIdx; i < clickIdx + 20 && i < pathLen; i++) {
					var dest = node.getPointAtLength(i);
					var dx = dest.x - point[0];
					var dy = dest.y - point[1];
					var distance = dx * dx + dy * dy;
					distanceall.push({
						'distance': distance,
						'idx': i
					});
				}
				var clickIdx = distanceall[d3.minIndex(distanceall, d => d.distance)].idx;
				var dest = node.getPointAtLength(clickIdx);
				var near = node.getPointAtLength(clickIdx - 1);
				var angle = Math.atan2(dest.y - near.y, dest.x - near.x) * 180 / Math.PI;
				//V1中保存一个分割
				this.triggers.shift();
				this.triggers.push({
					x: dest.x,
					y: dest.y,
					angle: angle,
					id: this.trigger_id++
				});
				this.render_trigger();
			},
			/**
			 * 画赛道分割线
			 */
			render_trigger() {
				var trigger = d3.select("svg").select("g").selectAll("line.track_trigger").data(this.triggers, (d) => d.id);
				trigger.enter().append("line").attr(
						"x1", (d) => d.x).attr("x2", (d) =>
						d.x).attr(
						"y1", (d) => d.y - 15).attr("y2", (d) => d.y + 15).attr("transform", (d) => "rotate(" + d.angle +
						"," + d.x +
						"," + d.y + ")")
					.attr("class", "track_trigger");
				trigger.exit().remove()
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
		margin-bottom: 10px;
	}

	.play {
		border: 1px solid #DCDFE6;
		border-radius: 0px;
		padding: 15px;
		margin-bottom: 10px;
	}

	.table {
		box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
	}

	svg .track_trigger {
		stroke: #000000;
		stroke-width:2;
	}
</style>
