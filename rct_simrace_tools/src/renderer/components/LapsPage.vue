<template>
	<el-container>
		<el-aside width="auto">
			<el-table :data="lapsData" style="width: 100%;" max-height="550" height="550" border :row-class-name="lapsDataClass">
				<el-table-column type="selection" width="55">
				</el-table-column>
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
			<div id="track_map" style="border:#EBEEF5 solid 1px;margin-top: 5px;">
				<svg width="400" height="400">
					<g></g>
				</svg>
			</div>
		</el-aside>
		<el-container>
			<el-header>
				<div class="info">

					<el-row type="flex" align="middle">
						<el-col :span="24">
							<el-descriptions>
								<el-descriptions-item label="Driver">nick</el-descriptions-item>
								<el-descriptions-item label="Car">AMG GT3</el-descriptions-item>
								<el-descriptions-item label="Track">XIC</el-descriptions-item>
							</el-descriptions>
							<el-descriptions :column="6" border v-if="realtime_show">
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

					</el-row>

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
				</div>
			</el-header>
			<el-main>


			</el-main>
		</el-container>
	</el-container>

</template>

<script>
	/* eslint-disable */
	import ACRemoteTelemetryClient from '@/components/modules/ac/ACRemoteTelemetryClient';
	import {
		common,
		gps_utils
	} from '@/components/modules/common/common'
	import moment from 'moment'

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
				zoom: 10,
				xscl: undefined,
				yscl: undefined,
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
						this.$data.sector_show = false;
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
			lapsDataClass({
				row,
				rowIdx
			}) {
				return row.class;
			},
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
								if (column_name == "time") {

									vob_row_data[column_name] = vob_row[i];
								} else {
									vob_row_data[column_name] = parseFloat(vob_row[i]);

								}

							}
							this.vob_data.push(vob_row_data);
						}
					}
				});
				objReadline.on('close', () => {
					console.log("VOB文件分析完成")
					this.render_track_vob();
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
			render_track_vob() {
				var margin = {
						top: 15,
						right: 15,
						bottom: 15,
						left: 15
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
					.scaleExtent([1/this.zoom,5])
					.translateExtent([
						[0, 0],
						[width * this.zoom, height * this.zoom]
					]).on("zoom", handleZoom);
				d3.select("#track_map svg").call(zoom);
				svg.call(zoom.transform, d3.zoomIdentity.translate(margin.left,margin.right).scale(1/this.zoom*2))
				this.xscl = d3.scaleLinear()
					.domain(d3.extent(this.vob_data, function(d) {
						return d.lat;
					})) //use just the x part
					.range([0, width * this.zoom])

				this.yscl = d3.scaleLinear()
					.domain(d3.extent(this.vob_data, function(d) {
						return d.long;
					})) // use just the y part
					.range([height * this.zoom, 0])


				var path = g.append("path")
					.datum(this.vob_data)
					.attr("fill", "none")
					.attr("stroke", "green")
					.attr("stroke-width", 2)
					.attr("d", d3.line()
						.x((d) => this.xscl(d.lat)) // apply the x scale to the x data
						.y((d) => this.yscl(d.long)))
				//自动计算赛道“起/终点” trigger
				var max_idx = d3.scan(this.vob_data, function(a, b) {
					return b.velocity - a.velocity
				});
				var auto_trigger = this.vob_data[max_idx];
				this.add_trigger_in_path([this.xscl(auto_trigger.lat), this.yscl(auto_trigger.long)]);
				//点击赛道预览图可修改赛道trigger
				path.on("click", (e, d) => {
					var pointer = d3.pointer(e);
					this.add_trigger_in_path(pointer);
				});
			},
			/**
			 * type [start_end 赛道发车线,sector 赛道分段线] 
			 */
			add_trigger_in_path(point, type = "start_end") {
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
				var angle = common.angle(dest, near);
				//V1中保存一个分割
				this.triggers.shift();

				var trigger = {
					p1: common.getRotatePoint(400 * this.zoom, {
						x: dest.x,
						y: dest.y - 15 * this.zoom
					}, {
						x: dest.x,
						y: dest.y
					}, -angle),
					p2: common.getRotatePoint(400 * this.zoom, {
						x: dest.x,
						y: dest.y + 15 * this.zoom
					}, {
						x: dest.x,
						y: dest.y
					}, -angle),
					type: type,
					id: this.trigger_id++
				};
				trigger.origin_p1 = {
					x: this.xscl.invert(trigger.p1.x),
					y: this.yscl.invert(trigger.p1.y)
				};
				trigger.origin_p2 = {
					x: this.xscl.invert(trigger.p2.x),
					y: this.yscl.invert(trigger.p2.y)
				};
				this.triggers.push(trigger);
				this.render_trigger();
			},
			/**
			 * 画赛道分割线
			 */
			render_trigger() {
				var trigger = d3.select("svg").select("g").selectAll("line.track_trigger").data(this.triggers, (d) => d.id);
				trigger.enter().append("line").attr(
						"x1", (d) => d.p1.x).attr("x2", (d) =>
						d.p2.x).attr(
						"y1", (d) => d.p1.y).attr("y2", (d) => d.p2.y)
					.attr("class", (d) => "track_trigger" + " " + d.type).attr("id", (d) => "tid_" + d.id);
				trigger.exit().remove();
				this.track_laps_vob();
			},
			/**
			 * 计算单圈数据
			 */
			track_laps_vob() {
				this.lapsData = [];
				//分割成单圈数据，需要将屏幕坐标系数据转为原始数据坐标系后，进行数据对比，通过判断先进线与分割线是否相交触发分割逻辑
				var seTrigger = this.triggers.filter((t) => t.type == "start_end"); //起点/终点2合1触发器
				if (seTrigger.length == 0) {
					this.$message("没有设置赛道起/终点");
					return;
				}
				seTrigger = seTrigger[0];
				var found = false,
					found_idx = 0;
				for (var i = 0; i < this.vob_data.length - 1; i++) {
					var cross = common.isIntersecting(seTrigger.origin_p1, seTrigger.origin_p2, {
						x: this.vob_data[i].lat,
						y: this.vob_data[i].long
					}, {
						x: this.vob_data[i + 1].lat,
						y: this.vob_data[i + 1].long
					});
					if (cross) {
						console.log("计算单圈数据,发现新单圈.两线段交点:%o,数据索引:%d", cross, found_idx)
						//发现一个单圈数据
						var begin = moment(this.vob_data[found_idx].time, "HHmmss.SS");
						var last_vob = this.vob_data[i];
						var end = moment(last_vob.time, "HHmmss.SS");
						var millsecond = end - begin;
						var distance = gps_utils.distanceTo(gps_utils.convertLatLngToDecimal({
							lat: last_vob.lat,
							long: last_vob.long
						}), gps_utils.convertLatLngToDecimal({
							lat: cross.x,
							long: cross.y
						}));
						var speed = last_vob.velocity * 1000 / 3600;
						//计算当前位置与交点垂直距离，相邻两采样点(速度,距离，时间)三维数据，使用线性插值算法估算时间到实际触发点时间 TODO
						var estimate = distance / speed;
						millsecond += estimate * 1000;
						console.log("距离:%f,速度:%f,时间:%f,%f", distance, speed, distance / speed, millsecond)

						if (millsecond > 20000) {
							//小于10秒不算单圈
							this.lapsData.push({
								beginIdx: found_idx,
								endIdx: i,
								lap: this.lapsData.length + 1,
								millsecond: millsecond,
								laptime: moment.utc(millsecond).format('mm.ss.SS'),
								class: 'row_normal'
							});
						}
						found_idx = i + 1;
					}
				}
				//最后剩余部分数据以灰度显示
				if (found_idx < this.vob_data.length) {
					var begin = moment(this.vob_data[found_idx].time, "HHmmss.SS");
					var end = moment(this.vob_data[this.vob_data.length - 1].time, "HHmmss.SS");
					var millsecond = end - begin;
					if (millsecond > 20000) {
						//小于10秒不算单圈
						this.lapsData.push({
							beginIdx: found_idx,
							endIdx: i,
							lap: this.lapsData.length + 1,
							millsecond: millsecond,
							laptime: moment.utc(millsecond).format('mm.ss.SS'),
							class: 'row_leave'
						});
					}
				}
				//最佳成绩显示样式
				this.lapsData[d3.minIndex(this.lapsData, d => Number(d.millsecond))].class = "row_best";
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
		min-width: 800px;
		padding: 15px;
		margin-bottom: 10px;
	}

	.play {
		border: 1px solid #EBEEF5;
		border-radius: 0px;
		padding: 15px;
		margin-top: 10px;
		margin-bottom: 10px;
	}

	svg .track_trigger {
		stroke-width: 2;
	}
	svg path{
		stroke-width: 1;
	}
	.start_end {
		stroke: #000000;
	}

	.sector {
		stroke: #D91E18;
	}

	.el-table .row_normal {}

	.el-table .row_best {
		background: #13CE66;
	}

	.el-table .row_leave {
		background: #8C939D;
	}
</style>
