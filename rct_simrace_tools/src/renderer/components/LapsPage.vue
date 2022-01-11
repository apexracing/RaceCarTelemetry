<template>
	<el-container>
		<el-aside width="410px">
			<el-table ref="lapTable" :data="lapsData" style="width: 100%;" height="550" border :row-class-name="lapsDataClass"
			 @current-change="lapsSelection" highlight-current-row>
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
			<el-tabs>
				<el-tab-pane label="赛道地图">
					<div id="track_map" style="border:#EBEEF5 solid 1px;">
						<svg width="400" height="400">
							<g></g>
						</svg>
					</div>
				</el-tab-pane>
				<el-tab-pane label="合成G力">
					<div id="gg_map" style="border:#EBEEF5 solid 1px;">
						<svg width="400" height="400">
							<g></g>
						</svg>
					</div>
				</el-tab-pane>
			</el-tabs>

		</el-aside>
		<el-main>
			<!-- <div class="info">
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
					<el-row type="flex" align="middle" justify="space-between">
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
				</div> -->
			<div id="analysis_chart">
				<svg width="100%" height="550" style="border:#EBEEF5 solid 1px;">

				</svg>
			</div>
		</el-main>
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
				zoom: 15, //地图最大细节倍数
				xscl: undefined,
				yscl: undefined,
				ggmap_xScale: undefined,
				ggmap_yScale: undefined,
				ggmap_color: undefined,
				trackerPlayer: 0,
				triggers: [],
				trigger_id: 0,
				vob_column: [],
				vob_data: [],
				realtime_show: true,
				sector_show: false,
				lapsData: [],
				lap_selection: null
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
				var last_time = null;
				objReadline.on('line', (line) => {
					if (line.startsWith("[")) {
						section = line;
					} else if (line.length > 0) {
						if (section == "[column names]") {
							var columns = line.trim().split(" ");
							this.vob_column = columns.map(function(d) {
								//适配harry'laptimer和Racechrono导出的vbo文件
								if (d == "longacc") {
									return "acc_x"
								}
								if (d == "latacc") {
									return "acc_y"
								}
								if (d == "x_acc-acc") {
									return "acc_x"
								}
								if (d == "y_acc-acc") {
									return "acc_y"
								}
								return d;
							})
						}
						if (section == "[data]") {
							var vob_row = line.trim().split(" ");
							var vob_row_data = {};
							for (var i in vob_row) {
								var column_name = this.vob_column[i];
								if (column_name == "time") {
									vob_row_data[column_name] = moment(vob_row[i], "HHmmss.SS").valueOf();
								} else {
									vob_row_data[column_name] = parseFloat(vob_row[i]);
								}
							}
							var latlong = gps_utils.convertLatLngToDecimal({
								lat: vob_row_data["lat"],
								long: vob_row_data["long"]
							})
							vob_row_data["lat"] = latlong.lat;
							vob_row_data["long"] = -latlong.long;
							//添加平面坐标通道,单位:米
							var xy = gps_utils.toEarthCoordinate(vob_row_data);
							vob_row_data["x"] = xy.x;
							vob_row_data["y"] = xy.y;
							this.vob_data.push(vob_row_data);
						}
					}
				});
				objReadline.on('close', () => {
					//计算数学通道数据
					var cloneData=[];
				
					var first_row=this.vob_data[0];
					var last_row=first_row;
					const G=9.80665;//重力加速度常量
					for(var i=1;i<this.vob_data.length;i++){
						 var vob_row=this.vob_data[i];
						 //时间位移通道
						vob_row["time_elapsed"] = vob_row["time"] -  first_row["time"];
						var d_detla=(vob_row["time"] -  last_row["time"])/1000;//毫秒转为秒
						var velocity=vob_row["velocity"]*1000/3600;//km/h->m/s
						var velocity_last=last_row["velocity"]*1000/3600;//km/h->m/s
						//添加lateral_acc 公式1:R=V/w(V是切向速度(米/秒),w是heading计算出的角速度(弧度/秒),R半径(米)) 公式2:A=V²/R/G (G=9.80665)
						var headingDetla=vob_row["heading"]-last_row["heading"];
						var TH=180;//360度->1度,3度->360度，阀值
						if(headingDetla>TH){
							headingDetla-=360;
						}else if(headingDetla<-TH){
							headingDetla+=360;
						}
						var w=-1*headingDetla/180*Math.PI/d_detla;
						var R=w==0?0:velocity/w;
						
						vob_row["lateral_acc"]=R==0?0:Math.pow(velocity,2)/R/G;
						//添加longitudinal_acc;公式:(V1-V2)/dθ/G (V是速度,dθ时差)
						vob_row["longitudinal_acc"]=(velocity-velocity_last)/d_detla/G;
						//计算lean angle 公式:ARCTAN(lateral_acc)*180/PI
						vob_row["lean_angle"]=Math.atan(vob_row["lateral_acc"])*180/Math.PI;
						last_row=vob_row;
						//添加行驶距离
						vob_row["distance_traveled"]=0;
						cloneData.push(vob_row);
					}
					this.vob_data=cloneData;
					console.log(cloneData);
					console.log("VOB文件分析完成")
					this.render_track_vob();
					this.render_analysis_chart(this.vob_data, {
						channels: [{
							name: 'time_elapsed',
							label: '时间',
							show_line: false,
							formater: (val) => {
								return d3.format('.1f')(val / 1000) + "秒"
							}
						}, {
							name: 'velocity',
							label: '速度',
							percent: 0.8,
							formater: (val) => {
								return d3.format('.2f')(val) + "Km/h"
							}
						}, {
							name: 'heading',
							label: '方位角',
							show_yAxis: true,

							formater: (val) => {
								return d3.format('.2f')(val) + "°"
							}
						}, {
							name: 'longitudinal_acc',
							label: '纵向加速度',
							percent: 0.5,
							formater: (val) => {
								return d3.format('.2f')(val) + "G"
							}
						}, {
							name: 'lateral_acc',
							label: '横向加速度',
							percent: 0.3,
							formater: (val) => {
								return d3.format('.2f')(val) + "G"
							}
						}],
						color: function(c) {
							if (c === 'heading') {
								return 'green';
							} else if (c === 'velocity') {
								return 'red';
							} else if (c === 'longitudinal_acc') {
								return 'blue';
							} else if (c === 'lateral_acc') {
								return '#800080';
							}
							return '#303133';
						}
					});
					//console.log(this.vob_column);
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
					.scaleExtent([1, 15])
					.translateExtent([
						[0, 0],
						[width, height]
					]).on("zoom", handleZoom);
				d3.select("#track_map svg").call(zoom);
				var xDomain = d3.extent(this.vob_data, function(d) {
					return d.long;
				});
				var yDomain = d3.extent(this.vob_data, function(d) {
					return d.lat;
				});
				var scaleXY = (xDomain[1] - xDomain[0]) / (yDomain[1] - yDomain[0]);
				this.xscl = d3.scaleLinear()
					.domain(xDomain) //use just the x part
					.range([0, scaleXY > 1 ? width : width * scaleXY])

				this.yscl = d3.scaleLinear()
					.domain(yDomain) // use just the y part
					.range([scaleXY > 1 ? height / scaleXY : height, 0])


				var path = g.append("path")
					.datum(this.vob_data)
					.attr("fill", "none")
					.attr("d", d3.line()
						.x((d) => this.xscl(d.long)) // apply the x scale to the x data
						.y((d) => this.yscl(d.lat)))
				//自动计算赛道“起/终点” trigger
				var max_idx = d3.scan(this.vob_data, function(a, b) {
					return b.velocity - a.velocity
				});
				var auto_trigger = this.vob_data[max_idx];
				this.add_trigger_in_path([this.xscl(auto_trigger.long), this.yscl(auto_trigger.lat)]);
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
				var loadingInstance = Loading.service({
					fullscreen: true,
					'text': 'analyse lap times ...'
				});
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
					p1: common.getRotatePoint(400, {
						x: dest.x,
						y: dest.y - 15
					}, {
						x: dest.x,
						y: dest.y
					}, -angle),
					p2: common.getRotatePoint(400, {
						x: dest.x,
						y: dest.y + 15
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
				loadingInstance.close();
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
				var found_idx = 0;
				var begin_trigger = false,
					end_trigger = false;
				var last_millsecond = 0; //moment(this.vob_data[found_idx].time, "HHmmss.SS");
				for (var i = 0; i < this.vob_data.length - 1; i++) {
					var current_vob = this.vob_data[i];
					var next_vob = this.vob_data[i + 1];
					var cross = common.isIntersecting(seTrigger.origin_p1, seTrigger.origin_p2, {
						x: current_vob.long,
						y: current_vob.lat
					}, {
						x: next_vob.long,
						y: next_vob.lat
					});
					if (cross) {
						console.log("计算单圈数据,发现新单圈.两线段交点:%o,trigger:%o,current_vob:%o,next_vob:%o,数据索引:%d", cross, seTrigger, current_vob,
							next_vob, i)
						//发现一个单圈数据
						var timeCurrent = current_vob.time; //实际采样点单圈结束时间
						var timeNext = next_vob.time; //实际采样点单圈结束时间

						var distanceVob = gps_utils.distanceTo(current_vob, next_vob)
						var distanceCross = gps_utils.distanceTo(current_vob, {
							lat: cross.y,
							long: cross.x
						});
						//计算当前位置与交点垂直距离，相邻两采样点(速度,距离，时间)三维数据，使用线性插值算法估算时间到实际触发点时间,距离->速度，距离/速度(km/h)
						var velocityCross = common.lineInterpolationInvert(distanceCross, [0, distanceVob], [current_vob.velocity,
							next_vob.velocity
						]);
						var end = timeCurrent + distanceCross / (velocityCross * 1000 / 3600) * 1000;
						if (!begin_trigger) {
							begin_trigger = true;
							last_millsecond = end;
						} else {
							var millsecond = end - last_millsecond;
							if (millsecond > 20000) {
								//小于10秒不算单圈
								this.lapsData.push({
									beginIdx: found_idx,
									endIdx: i,
									lap: this.lapsData.length + 1,
									millsecond: millsecond,
									laptime: moment.utc(Math.ceil(millsecond)).format('mm.ss.SS'),
									class: 'row_normal'
								});
								last_millsecond = end;
							} else {
								continue;
							}
						}
						found_idx = i;
						console.log("预估结束时间:%f,采样点结束时间:%s,到终点距离:%f米,采样点瞬时速度:%f", end, timeCurrent, distanceCross, current_vob.velocity)
					}
				}
				//最后剩余部分数据以灰度显示
				if (found_idx < this.vob_data.length) {
					var end = moment(this.vob_data[this.vob_data.length - 1].time, "HHmmss.SS");
					var millsecond = end - last_millsecond;
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
				var bestLap = d3.minIndex(this.lapsData, d => Number(d.millsecond))
				this.lapsData[bestLap].class = "row_best";
				this.render_xyplot_vob(this.vob_data);
				/* this.$nextTick(function () {
					this.$refs.lapTable.setCurrentRow(this.lapsData[bestLap]);
				}) */

			},
			lapsSelection(lap) {
				//this.lap_selection = lap;
				//this.render_xyplot_vob(lap);
			},
			/**
			 * 渲染抓地力圆图
			 * @param {type} lap 要渲染的lapdata
			 */
			render_xyplot_vob(data) {
				var data=common.three_sigma(data,(d)=>d.acc_x*d.acc_x+d.acc_y*d.acc_y);
			
				var margin = {
					top: 5,
					right: 5,
					bottom: 5,
					left: 5
				};
				var svg = d3.select("#gg_map svg");
				var width = svg.attr("width") - margin.left - margin.right;
				var height = svg.attr('height') - margin.top - margin.bottom;
				var xyPlotView = svg.select("g")
					.attr("transform",
						"translate(" + margin.left + "," + margin.top + ")");
				var xDomain = d3.extent(data, function(d) {
					return d.lateral_acc;
				});
				var yDomain = d3.extent(data, function(d) {
					return d.longitudinal_acc;
				});
				var xyDomain=d3.extent(xDomain.concat(yDomain));
				this.ggmap_xScale = d3.scaleLinear()
					.domain(xyDomain)
					.range([0, width])
				this.ggmap_yScale = d3.scaleLinear()
					.domain(xyDomain)
					.range([height, 0])
				var maxG=d3.max(data.map(d=>d.longitudinal_acc*d.longitudinal_acc+d.lateral_acc*d.lateral_acc))
				this.ggmap_color = d3.scaleSequential().domain([maxG,0])
				.interpolator(d3.interpolateCool);
				
				xyPlotView.selectAll("dot").data(data)
					.enter()
					.append("circle")
					.attr("cx", (d) => this.ggmap_xScale(d.lateral_acc))
					.attr("cy", (d) => this.ggmap_yScale(d.longitudinal_acc))
					.attr("r", 1)
					.style("fill", (d) => this.ggmap_color(d.longitudinal_acc*d.longitudinal_acc+d.lateral_acc*d.lateral_acc))
					.exit().remove();
				// 定义X轴
				var xAxis = d3.axisBottom()
					.scale(this.ggmap_xScale)
					.tickFormat((d) => d+"G")
					.ticks(11)
				// 定义Y轴  
				var yAxis = d3.axisLeft()
					.scale(this.ggmap_yScale)
					.tickFormat((d) => d+"G")
					.ticks(11)
				// 创建X轴, svg中： g元素是一个分组元素  
				xyPlotView.append('g')
					.attr('class', 'axis')
					.attr("transform", "translate(0," + 0.5 * height + ")") // 平移到水平中间
					.call(xAxis);
				// 创建Y轴  
				xyPlotView.append('g')
					.attr('class', 'axis')
					.attr("transform", "translate(" + 0.5 * width + ",0)") // 平移到竖直中间
					.call(yAxis);
			},
			render_analysis_chart(data, {
				channels = [],
				x = (d) => d.time_elapsed / 1000,
				color = 'blue'
			}) {
				var margin = {
					top: 20,
					right: 10,
					bottom: 40,
					left: 10
				};
				var svg = d3.select("#analysis_chart svg");

				var width = svg.node().getBoundingClientRect().width - margin.left - margin.right;
				var height = svg.attr('height') - margin.top - margin.bottom;
				var channelView = svg.append("g")
					.attr("transform",
						"translate(" + margin.left + "," + margin.top + ")");
				var X = d3.map(data, x);
				var xDomain = d3.extent(X);

				var xScale = d3.scaleLinear(xDomain, [0, width]);
				//各数据通道YScale,YDomain,YData存储到Map里
				const I = d3.range(X.length);
				var channelMap = new Map();
				var channelData = new Map();
				var channelDomain = new Map();
				var channelScale = new Map();
				var channelLine = new Map();
				var channelYAxis = new Map();
				for (var c of channels) {
					if (c.show_line != undefined && !c.show_line) { //不显示数据通道，紧显示标签数据
						continue;
					}
					var channelName = c.name;
					channelMap.set(channelName, I);
					var Y = d3.map(data, d => d[channelName]);
					var yDomain = d3.extent(Y);
					var yRange = [height, c.percent > 0 ? height * (1 - c.percent) : 0];
					var yScale = d3.scaleLinear(yDomain, yRange);
					channelDomain.set(channelName, yDomain);
					channelScale.set(channelName, yScale);
					channelData.set(channelName, Y);
					var line = d3.line()
						.x(i => xScale(X[i.n]))
						.y(i => channelScale.get(i.channel)(channelData.get(i.channel)[i.n]));
					channelLine.set(channelName, line);
					if (c.show_yAxis) {
						var yAxis = d3.axisRight(yScale)
							.tickFormat(c.formater ? c.formater : (d) => d)
							.tickSize(width + margin.left + margin.right);
						channelYAxis.set(c, yAxis);
						channelView.append("g").attr('class', "y--axis")
							.call(yAxis)
							.call(g => g.select('path').remove())
							.call(g => g.selectAll("text").attr("x", 1).attr('y', -5))
					}
				};

				var xAxis = d3.axisTop(xScale).tickFormat((d) => {
					var p = !(d % 1) ? d : d3.format('.2f')(d);
					return p + "秒"
				}).tickSize(-height - margin.top - margin.bottom);
				//移除横线
				var xG = channelView.append("g").attr("class", "x--axis")
					.call(xAxis)
					.call(g => g.select('path').remove())
					.call(g => g.selectAll("text").attr("x", 20))
					.call(g => g.selectAll("line").attr("transform", "translate(0,-" + margin.top + ")"))
				//横向缩放
				var zoom = d3.zoom()
					.scaleExtent([1, xDomain[1] * 10])
					.translateExtent([
						[0, 0],
						[width, height]
					])
					.on("zoom", (e) => {
						//xScale.range([0, width].map(d => e.transform.applyX(d)));
						var xt = e.transform.rescaleX(xScale);

						var xt = e.transform.rescaleX(xScale);
						xG.call(xAxis.scale(xt))
							.call(g => g.select('path').remove())
							.call(g => g.selectAll("text").attr("x", 20))
							.call(g => g.selectAll("line").attr("transform", "translate(0,-" + margin.top + ")"))
						//
						channelView.selectAll(".y_data").attr("d", ([channel, I]) => {
							var linesData = d3.map(I, (i) => {
								return {
									'n': i,
									'channel': channel
								}
							});
							return channelLine.get(channel).x(function(i) {
								return xt(X[i.n]);
							})(linesData);
						})

					})

				//画各通道曲线
				channelView.append("clipPath")
					.attr("id", "clip")
					.append("rect")
					.attr("width", width)
					.attr("height", height);
				channelView.append("g").attr("fill", "none")
					.attr("stroke-width", 1)
					.selectAll("path").data(channelMap).join("path")
					.attr("clip-path", "url(#clip)")
					.attr("class", "y_data")
					.attr(
						"stroke", typeof color ===
						"function" ? ([channel]) => color(channel) : color)
					.attr("d", ([channel, I]) => {
						//根据不同channel
						var linesData = d3.map(I, (i) => {
							return {
								'n': i,
								'channel': channel
							}
						});
						return channelLine.get(channel)(linesData);
					});
				//画底部数据显示标签
				channelView.append("g").append("line").attr('class', 'realtimeDataLine')
					.attr("x1", 0).attr("y1", height).attr("x2", width + margin.left + margin.right).attr("y2", height)
					.attr("transform", "translate(-" + margin.left + ",0)");
				channelView.append("g").attr('class', 'realtimeData')
					.selectAll("text")
					.data(channels)
					.join("text")
					.attr("fill", typeof color === "function" ? (channel) => color(channel.name) : color)
					.attr("x", (d, i) => {
						return i * 120;
					})
					.attr("y", height + margin.bottom / 2)
					.text(d => d.label + ":")
					.attr("id", d => d.name);
				//设置默认值为第一条数据内容
				d3.selectAll(".realtimeData text").text(d => {
					return d.label + ":" + (d.formater ? d.formater(data[0][d.name]) : data[0][d.name]);
				})
				//数据二分查找器
				var bisectX = d3.bisector(x).center;
				//画鼠标数据定位竖线
				var mouseLine = channelView.append("g").append("line").attr('class', 'mouseLine')
					.attr("opacity", "0")
					.attr("x1", 0).attr("y1", 0)
					.attr("x2", 0).attr("y2", height + margin.top)
					.attr("transform", "translate(0,-" + margin.top + ")");
				var mouseZone = channelView.append('svg:rect')
					.attr("width", width)
					.attr("height", height)
					.attr("fill", "none")
					.attr('pointer-events', 'all')
					.on('mouseout', function() {
						d3.select('.mouseLine').attr('opacity', '0');
					})
					.on('mouseout', function() {
						d3.select('.mouseLine').attr('opacity', '0');
					})
					.on('mouseover', function() {
						d3.select('.mouseLine').attr('opacity', '1');
					})
					.on('mousemove', function(e) {
						var mouse_x = d3.pointer(e)[0];
						d3.select('.mouseLine').attr('x1', mouse_x).attr('x2', mouse_x);
						var xt = d3.zoomTransform(this).rescaleX(xScale);

						var mouse_xdata = xt.invert(mouse_x);
						var dataIdx = bisectX(data, mouse_xdata);
						d3.selectAll(".realtimeData text").text(d => {
							return d.label + ":" + (d.formater ? d.formater(data[dataIdx][d.name]) : data[dataIdx][d.name]);
						})
					})

				svg.call(zoom);
				svg.call(zoom.transform, d3.zoomIdentity.scale(xDomain[1] / 100));


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

	#track_map svg .track_trigger {
		stroke-width: 2;
	}

	#track_map svg path {
		shape-rendering: geometricPrecision;
		stroke-width: 0.2px;
		stroke: green;
	}

	.start_end {
		stroke: #000000;
	}

	.sector {
		stroke: #D91E18;
	}

	.el-table .row_normal {}

	.el-table .row_best {
		background: #67C23A;
	}

	.el-table .row_leave {
		background: #909399;
	}

	.el-main {}

	.x--axis line {
		shape-rendering: crispEdges;
		stroke-width: 1px;
		stroke: #e7e7e7;
	}

	.x--axis text {
		fill: #555;
		font-size: 12px;
	}

	.y--axis line {
		shape-rendering: crispEdges;
		stroke-width: 1px;
		stroke: #e7e7e7;
		stroke-dasharray: 3, 1;
	}

	.y--axis text {
		font-size: 12px;
		fill: #555;
	}

	.y_data {
		shape-rendering: geometricPrecision;
		stroke-width: 1px;
	}

	.mouseLine {
		shape-rendering: crispEdges;
		stroke: red;
		stroke-width: 1px;
		stroke-dasharray: 3, 1;
	}

	.realtimeDataLine {
		shape-rendering: crispEdges;
		file: none;
		stroke-dasharray: 5, 5;
		stroke: #909399;
		stroke-width: 1px;
	}

	.realtimeData text {
		text-rendering: optimizeLegibility;
		font-size: 12px;
	}
</style>
