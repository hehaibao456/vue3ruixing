<template>
  <!-- 主容器：100%宽50%高，溢出隐藏，作为打字容器 -->
  <div class="typewriter-container" :class="{ collapsed: isCollapsed }" ref="containerRef">
    <button type="button" class="toggle-btn" @click.stop="toggleOverlay">
      {{ isCollapsed ? '展开公告' : '收起公告' }}
    </button>

    <!-- 打字内容容器：纯流式布局，所有行堆叠，无多余边距 -->
    <div class="typewriter-content" ref="contentRef" v-show="!isCollapsed">
      <!-- 旧版（时间与内容同色）保留备选：
      <div class="type-line" v-for="(line, idx) in renderLines" :key="idx">
        {{ line }}
      </div>
      <div class="type-line type-current">
        <span>{{ currentText }}</span><span class="cursor">_</span>
      </div>
      -->

      <!-- 已完成的行：逐行渲染，裁剪后整体上移 -->
      <div class="type-line" v-for="(line, idx) in renderLines" :key="idx">
        <span class="time">{{ splitLine(line).prefix }}</span>
        <span class="content">{{ splitLine(line).content }}</span>
      </div>
      <!-- 当前打字行：左到右逐字，满行换行，底部完整显示 -->
      <div class="type-line type-current">
        <span class="time">{{ splitLine(currentText).prefix }}</span>
        <span class="content">{{ splitLine(currentText).content }}</span><span class="cursor">_</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'

// ************************* 自定义配置 *************************
const CONFIG = {
  TYPE_SPEED: 100, // 打字速度(ms/字符)，越大越慢
  TEXT_CONTENT: `[BRAIN][BOOT] agent_brain v2.9.4 | mode=HIL+SIL | scenario=Island-Relief-Drill
[BRAIN][CFG ] net.policy: ctrl=mesh sec=lte | video=mesh abr=on
[BRAIN][CFG ] mesh band=5.8G tx_power=20dBm roster=18
[BRAIN][HIL ] real-assets online: RW-UAV-REAL-01, USV-REAL-01
[BRAIN][DISC] discovering agents...
[BRAIN][DISC] + agent_uav_fw_1 type=UAV link=mesh rssi=-76dBm
[BRAIN][DISC] + agent_uav_rw_1 type=UAV link=mesh rssi=-65dBm
[BRAIN][DISC] + agent_uav_rw_2 type=UAV link=mesh rssi=-78dBm
[BRAIN][DISC] + agent_uav_rw_3 type=UAV link=mesh rssi=-59dBm
[BRAIN][DISC] + agent_uav_rw_4 type=UAV link=mesh rssi=-76dBm
[BRAIN][DISC] + agent_usv_1 type=USV link=mesh rssi=-71dBm
[BRAIN][DISC] + agent_ground_01 type=HUMAN link=lte rssi=-73dBm
[BRAIN][DISC] + agent_ground_02 type=HUMAN link=lte rssi=-57dBm
[BRAIN][DISC] + agent_ground_03 type=HUMAN link=lte rssi=-66dBm
[BRAIN][DISC] + agent_ground_04 type=HUMAN link=lte rssi=-58dBm
[BRAIN][DISC] + agent_ground_05 type=HUMAN link=lte rssi=-57dBm
[BRAIN][DISC] + agent_ground_06 type=HUMAN link=lte rssi=-65dBm
[BRAIN][DISC] + agent_ground_07 type=HUMAN link=lte rssi=-62dBm
[BRAIN][DISC] + agent_ground_08 type=HUMAN link=lte rssi=-69dBm
[BRAIN][DISC] + agent_ground_09 type=HUMAN link=lte rssi=-73dBm
[BRAIN][DISC] + agent_ground_10 type=HUMAN link=lte rssi=-56dBm
[BRAIN][DISC] + agent_ground_11 type=HUMAN link=lte rssi=-72dBm
[BRAIN][DISC] + agent_ground_12 type=HUMAN link=lte rssi=-76dBm
[BRAIN][NET ] control-plane up | data-plane up | video-plane up
[BRAIN][PLAN] mission=relief+evac | phases=ASSEMBLE->TRANSIT->OVERWATCH->RECONFIG->END
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=1
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=1 encrypt=on
[BRAIN][FORM] reconfiguration trigger | target=LINE-ABREAST spacing=120m
[BRAIN][CTRL] cmd: formation_change(LINE-ABREAST)
[ACK][ACK ] agent_uav_rw_3 accepted | sep=120m rtt=35ms
[ACK][ACK ] agent_uav_rw_4 accepted | sep=120m rtt=40ms
[BRAIN][TELM] agent_uav_fw_1 batt=76% alt=149m vel=10m/s
[BRAIN][TELM] agent_uav_rw_2 batt=86% alt=147m vel=9m/s
[BRAIN][NET ] mesh health uplink=39Mbps downlink=31Mbps state=stable
[BRAIN][TELM] agent_uav_fw_1 batt=60% alt=136m vel=9m/s
[BRAIN][TELM] agent_uav_rw_1 batt=76% alt=129m vel=13m/s
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=2
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=2 encrypt=on
[BRAIN][NET ] mesh health uplink=27Mbps downlink=46Mbps state=degraded
[BRAIN][NET ] policy: rw_2 video mesh->lte | ctrl stays mesh
[BRAIN][TELM] agent_uav_rw_4 batt=70% alt=147m vel=14m/s
[BRAIN][EVNT] ground request from=agent_ground_05 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=48ms
[BRAIN][TELM] agent_uav_fw_1 batt=64% alt=138m vel=12m/s
[BRAIN][TELM] agent_uav_fw_1 batt=86% alt=137m vel=6m/s
[BRAIN][FORM] reconfiguration trigger | target=DIAMOND spacing=90m
[BRAIN][CTRL] cmd: formation_change(DIAMOND)
[ACK][ACK ] agent_uav_fw_1 accepted | sep=90m rtt=36ms
[ACK][ACK ] agent_uav_rw_1 accepted | sep=90m rtt=34ms
[BRAIN][TELM] agent_uav_rw_1 batt=76% alt=124m vel=6m/s
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=3
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=3 encrypt=on
[BRAIN][EVNT] ground request from=agent_ground_10 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=54ms
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=4
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=4 encrypt=on
[BRAIN][NET ] mesh health uplink=26Mbps downlink=34Mbps state=degraded
[BRAIN][NET ] policy: rw_2 video mesh->lte | ctrl stays mesh
[BRAIN][TELM] agent_uav_rw_2 batt=69% alt=105m vel=9m/s
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=5
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=5 encrypt=on
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=6
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=6 encrypt=on
[BRAIN][TELM] agent_uav_rw_2 batt=68% alt=141m vel=9m/s
[BRAIN][EVNT] ground request from=agent_ground_02 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=39ms
[BRAIN][TELM] agent_uav_rw_2 batt=60% alt=114m vel=8m/s
[BRAIN][TELM] agent_uav_rw_3 batt=83% alt=139m vel=8m/s
[BRAIN][TELM] agent_uav_rw_3 batt=76% alt=131m vel=7m/s
[BRAIN][TELM] agent_uav_rw_3 batt=78% alt=114m vel=8m/s
[BRAIN][TELM] agent_uav_rw_4 batt=73% alt=122m vel=10m/s
[BRAIN][FORM] reconfiguration trigger | target=DIAMOND spacing=90m
[BRAIN][CTRL] cmd: formation_change(DIAMOND)
[ACK][ACK ] agent_uav_rw_1 accepted | sep=90m rtt=50ms
[ACK][ACK ] agent_uav_rw_4 accepted | sep=90m rtt=43ms
[ACK][ACK ] agent_uav_fw_1 accepted | sep=90m rtt=23ms
[BRAIN][TELM] agent_uav_rw_2 batt=62% alt=150m vel=9m/s
[BRAIN][NET ] mesh health uplink=29Mbps downlink=28Mbps state=stable
[BRAIN][TELM] agent_uav_rw_4 batt=61% alt=146m vel=11m/s
[BRAIN][NET ] mesh health uplink=44Mbps downlink=44Mbps state=degraded
[BRAIN][NET ] policy: rw_2 video mesh->lte | ctrl stays mesh
[BRAIN][TELM] agent_uav_rw_1 batt=66% alt=121m vel=10m/s
[BRAIN][TELM] agent_uav_rw_2 batt=70% alt=160m vel=8m/s
[BRAIN][TELM] agent_uav_rw_4 batt=92% alt=158m vel=12m/s
[BRAIN][TELM] agent_uav_fw_1 batt=87% alt=154m vel=7m/s
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=7
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=7 encrypt=on
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=8
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=8 encrypt=on
[BRAIN][TELM] agent_uav_rw_1 batt=89% alt=125m vel=12m/s
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=9
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=9 encrypt=on
[BRAIN][NET ] mesh health uplink=29Mbps downlink=45Mbps state=stable
[BRAIN][TELM] agent_uav_rw_1 batt=68% alt=115m vel=12m/s
[BRAIN][NET ] mesh health uplink=30Mbps downlink=45Mbps state=degraded
[BRAIN][NET ] policy: rw_2 video mesh->lte | ctrl stays mesh
[BRAIN][TELM] agent_uav_fw_1 batt=65% alt=105m vel=6m/s
[BRAIN][TELM] agent_uav_rw_1 batt=86% alt=114m vel=12m/s
[BRAIN][NET ] mesh health uplink=26Mbps downlink=46Mbps state=stable
[BRAIN][TELM] agent_uav_rw_3 batt=71% alt=106m vel=14m/s
[BRAIN][TELM] agent_uav_rw_4 batt=67% alt=154m vel=7m/s
[BRAIN][FORM] reconfiguration trigger | target=LINE-ABREAST spacing=120m
[BRAIN][CTRL] cmd: formation_change(LINE-ABREAST)
[ACK][ACK ] agent_uav_rw_4 accepted | sep=120m rtt=49ms
[ACK][ACK ] agent_uav_rw_2 accepted | sep=120m rtt=52ms
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=10
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=10 encrypt=on
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=11
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=11 encrypt=on
[BRAIN][EVNT] ground request from=agent_ground_10 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=50ms
[BRAIN][TELM] agent_uav_fw_1 batt=71% alt=142m vel=11m/s
[BRAIN][EVNT] ground request from=agent_ground_02 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=45ms
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=12
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=12 encrypt=on
[BRAIN][NET ] mesh health uplink=24Mbps downlink=25Mbps state=degraded
[BRAIN][NET ] policy: rw_2 video mesh->lte | ctrl stays mesh
[BRAIN][TELM] agent_uav_rw_3 batt=89% alt=115m vel=14m/s
[BRAIN][TELM] agent_uav_rw_1 batt=71% alt=144m vel=8m/s
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=13
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=13 encrypt=on
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=14
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=14 encrypt=on
[BRAIN][TELM] agent_uav_rw_2 batt=90% alt=140m vel=11m/s
[BRAIN][EVNT] ground request from=agent_ground_05 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=43ms
[BRAIN][EVNT] ground request from=agent_ground_08 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=40ms
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=15
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=15 encrypt=on
[BRAIN][TELM] agent_uav_rw_2 batt=79% alt=135m vel=11m/s
[BRAIN][TELM] agent_uav_rw_4 batt=66% alt=156m vel=10m/s
[BRAIN][TELM] agent_uav_rw_1 batt=62% alt=140m vel=7m/s
[BRAIN][TELM] agent_uav_rw_1 batt=62% alt=132m vel=10m/s
[BRAIN][FORM] reconfiguration trigger | target=V-ECHELON spacing=80m
[BRAIN][CTRL] cmd: formation_change(V-ECHELON)
[ACK][ACK ] agent_uav_fw_1 accepted | sep=80m rtt=29ms
[ACK][ACK ] agent_uav_rw_1 accepted | sep=80m rtt=44ms
[BRAIN][EVNT] ground request from=agent_ground_01 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=50ms
[BRAIN][TELM] agent_uav_rw_3 batt=77% alt=160m vel=11m/s
[BRAIN][NET ] mesh health uplink=33Mbps downlink=31Mbps state=stable
[BRAIN][EVNT] ground request from=agent_ground_10 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=51ms
[BRAIN][TELM] agent_uav_rw_3 batt=72% alt=112m vel=8m/s
[BRAIN][TELM] agent_uav_rw_3 batt=68% alt=118m vel=10m/s
[BRAIN][TELM] agent_uav_fw_1 batt=89% alt=132m vel=11m/s
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=16
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=16 encrypt=on
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=17
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=17 encrypt=on
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=18
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=18 encrypt=on
[BRAIN][TELM] agent_uav_fw_1 batt=75% alt=100m vel=12m/s
[BRAIN][FORM] reconfiguration trigger | target=DIAMOND spacing=90m
[BRAIN][CTRL] cmd: formation_change(DIAMOND)
[ACK][ACK ] agent_uav_rw_1 accepted | sep=90m rtt=19ms
[ACK][ACK ] agent_uav_rw_2 accepted | sep=90m rtt=47ms
[ACK][ACK ] agent_uav_rw_3 accepted | sep=90m rtt=18ms
[BRAIN][NET ] mesh health uplink=24Mbps downlink=48Mbps state=stable
[BRAIN][NET ] mesh health uplink=21Mbps downlink=34Mbps state=degraded
[BRAIN][NET ] policy: rw_2 video mesh->lte | ctrl stays mesh
[BRAIN][EVNT] ground request from=agent_ground_03 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=27ms
[BRAIN][TELM] agent_uav_rw_2 batt=92% alt=132m vel=14m/s
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=19
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=19 encrypt=on
[BRAIN][TELM] agent_uav_rw_2 batt=89% alt=154m vel=9m/s
[BRAIN][FORM] reconfiguration trigger | target=COLUMN spacing=60m
[BRAIN][CTRL] cmd: formation_change(COLUMN)
[ACK][ACK ] agent_uav_rw_2 accepted | sep=60m rtt=38ms
[ACK][ACK ] agent_uav_rw_3 accepted | sep=60m rtt=34ms
[ACK][ACK ] agent_uav_rw_4 accepted | sep=60m rtt=39ms
[ACK][ACK ] agent_uav_rw_1 accepted | sep=60m rtt=38ms
[BRAIN][FORM] reconfiguration trigger | target=V-ECHELON spacing=80m
[BRAIN][CTRL] cmd: formation_change(V-ECHELON)
[ACK][ACK ] agent_uav_rw_4 accepted | sep=80m rtt=19ms
[ACK][ACK ] agent_uav_rw_2 accepted | sep=80m rtt=55ms
[ACK][ACK ] agent_uav_rw_1 accepted | sep=80m rtt=24ms
[ACK][ACK ] agent_uav_fw_1 accepted | sep=80m rtt=27ms
[BRAIN][TELM] agent_uav_fw_1 batt=64% alt=102m vel=9m/s
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=20
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=20 encrypt=on
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=21
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=21 encrypt=on
[BRAIN][TELM] agent_uav_rw_4 batt=80% alt=117m vel=6m/s
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=22
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=22 encrypt=on
[BRAIN][FORM] reconfiguration trigger | target=COLUMN spacing=60m
[BRAIN][CTRL] cmd: formation_change(COLUMN)
[ACK][ACK ] agent_uav_fw_1 accepted | sep=60m rtt=33ms
[ACK][ACK ] agent_uav_rw_1 accepted | sep=60m rtt=45ms
[ACK][ACK ] agent_uav_rw_3 accepted | sep=60m rtt=55ms
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=23
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=23 encrypt=on
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=24
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=24 encrypt=on
[BRAIN][EVNT] ground request from=agent_ground_02 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=29ms
[BRAIN][TELM] agent_uav_fw_1 batt=68% alt=116m vel=10m/s
[BRAIN][TELM] agent_uav_rw_1 batt=70% alt=117m vel=14m/s
[BRAIN][TELM] agent_uav_fw_1 batt=61% alt=149m vel=14m/s
[BRAIN][NET ] mesh health uplink=29Mbps downlink=35Mbps state=stable
[BRAIN][EVNT] ground request from=agent_ground_02 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=23ms
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=25
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=25 encrypt=on
[BRAIN][TELM] agent_uav_rw_1 batt=70% alt=146m vel=13m/s
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=26
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=26 encrypt=on
[BRAIN][NET ] mesh health uplink=23Mbps downlink=28Mbps state=degraded
[BRAIN][NET ] policy: rw_2 video mesh->lte | ctrl stays mesh
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=27
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=27 encrypt=on
[BRAIN][TELM] agent_uav_fw_1 batt=70% alt=154m vel=12m/s
[BRAIN][EVNT] ground request from=agent_ground_04 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=36ms
[BRAIN][TELM] agent_uav_rw_3 batt=62% alt=102m vel=13m/s
[BRAIN][TELM] agent_uav_rw_4 batt=80% alt=149m vel=11m/s
[BRAIN][TELM] agent_uav_rw_1 batt=80% alt=145m vel=10m/s
[BRAIN][TELM] agent_uav_fw_1 batt=84% alt=160m vel=13m/s
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=28
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=28 encrypt=on
[BRAIN][NET ] mesh health uplink=27Mbps downlink=25Mbps state=stable
[BRAIN][NET ] mesh health uplink=32Mbps downlink=32Mbps state=stable
[BRAIN][TELM] agent_uav_rw_4 batt=70% alt=100m vel=9m/s
[BRAIN][TELM] agent_uav_rw_1 batt=77% alt=142m vel=13m/s
[BRAIN][TELM] agent_uav_fw_1 batt=76% alt=125m vel=6m/s
[BRAIN][NET ] mesh health uplink=34Mbps downlink=45Mbps state=stable
[BRAIN][FORM] reconfiguration trigger | target=LINE-ABREAST spacing=120m
[BRAIN][CTRL] cmd: formation_change(LINE-ABREAST)
[ACK][ACK ] agent_uav_rw_2 accepted | sep=120m rtt=21ms
[ACK][ACK ] agent_uav_fw_1 accepted | sep=120m rtt=19ms
[ACK][ACK ] agent_uav_rw_4 accepted | sep=120m rtt=22ms
[ACK][ACK ] agent_uav_rw_1 accepted | sep=120m rtt=43ms
[BRAIN][EVNT] ground request from=agent_ground_12 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=39ms
[BRAIN][FORM] reconfiguration trigger | target=LINE-ABREAST spacing=120m
[BRAIN][CTRL] cmd: formation_change(LINE-ABREAST)
[ACK][ACK ] agent_uav_rw_3 accepted | sep=120m rtt=23ms
[ACK][ACK ] agent_uav_rw_2 accepted | sep=120m rtt=46ms
[BRAIN][TELM] agent_uav_rw_4 batt=77% alt=140m vel=10m/s
[BRAIN][TELM] agent_uav_rw_2 batt=70% alt=120m vel=10m/s
[BRAIN][TELM] agent_uav_rw_4 batt=67% alt=137m vel=11m/s
[BRAIN][TELM] agent_uav_fw_1 batt=77% alt=154m vel=8m/s
[BRAIN][FORM] reconfiguration trigger | target=LINE-ABREAST spacing=120m
[BRAIN][CTRL] cmd: formation_change(LINE-ABREAST)
[ACK][ACK ] agent_uav_rw_2 accepted | sep=120m rtt=21ms
[ACK][ACK ] agent_uav_rw_3 accepted | sep=120m rtt=39ms
[ACK][ACK ] agent_uav_fw_1 accepted | sep=120m rtt=38ms
[BRAIN][EVNT] ground request from=agent_ground_02 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=19ms
[BRAIN][FORM] reconfiguration trigger | target=LINE-ABREAST spacing=120m
[BRAIN][CTRL] cmd: formation_change(LINE-ABREAST)
[ACK][ACK ] agent_uav_rw_2 accepted | sep=120m rtt=52ms
[ACK][ACK ] agent_uav_rw_1 accepted | sep=120m rtt=55ms
[ACK][ACK ] agent_uav_rw_3 accepted | sep=120m rtt=38ms
[ACK][ACK ] agent_uav_fw_1 accepted | sep=120m rtt=34ms
[BRAIN][EVNT] ground request from=agent_ground_01 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=45ms
[BRAIN][TELM] agent_uav_fw_1 batt=78% alt=126m vel=14m/s
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=29
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=29 encrypt=on
[BRAIN][NET ] mesh health uplink=32Mbps downlink=35Mbps state=stable
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=30
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=30 encrypt=on
[BRAIN][TELM] agent_uav_rw_2 batt=77% alt=103m vel=13m/s
[BRAIN][TELM] agent_uav_rw_1 batt=65% alt=113m vel=10m/s
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=31
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=31 encrypt=on
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=32
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=32 encrypt=on
[BRAIN][TELM] agent_uav_rw_2 batt=69% alt=154m vel=11m/s
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=33
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=33 encrypt=on
[BRAIN][TELM] agent_uav_rw_1 batt=66% alt=158m vel=13m/s
[BRAIN][TELM] agent_uav_fw_1 batt=77% alt=137m vel=7m/s
[BRAIN][TELM] agent_uav_rw_2 batt=89% alt=137m vel=13m/s
[BRAIN][FORM] reconfiguration trigger | target=V-ECHELON spacing=80m
[BRAIN][CTRL] cmd: formation_change(V-ECHELON)
[ACK][ACK ] agent_uav_rw_3 accepted | sep=80m rtt=46ms
[ACK][ACK ] agent_uav_rw_1 accepted | sep=80m rtt=51ms
[ACK][ACK ] agent_uav_rw_2 accepted | sep=80m rtt=24ms
[BRAIN][FORM] reconfiguration trigger | target=COLUMN spacing=60m
[BRAIN][CTRL] cmd: formation_change(COLUMN)
[ACK][ACK ] agent_uav_fw_1 accepted | sep=60m rtt=18ms
[ACK][ACK ] agent_uav_rw_3 accepted | sep=60m rtt=40ms
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=34
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=34 encrypt=on
[BRAIN][TELM] agent_uav_rw_1 batt=71% alt=107m vel=7m/s
[BRAIN][TELM] agent_uav_fw_1 batt=87% alt=143m vel=13m/s
[BRAIN][NET ] mesh health uplink=35Mbps downlink=50Mbps state=stable
[BRAIN][NET ] mesh health uplink=30Mbps downlink=43Mbps state=stable
[BRAIN][TELM] agent_uav_rw_4 batt=86% alt=133m vel=7m/s
[BRAIN][EVNT] ground request from=agent_ground_05 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=42ms
[BRAIN][EVNT] ground request from=agent_ground_08 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=39ms
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=35
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=35 encrypt=on
[BRAIN][TELM] agent_uav_rw_2 batt=69% alt=100m vel=8m/s
[BRAIN][TELM] agent_uav_rw_1 batt=65% alt=126m vel=10m/s
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=36
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=36 encrypt=on
[BRAIN][TELM] agent_uav_rw_4 batt=71% alt=102m vel=10m/s
[BRAIN][TELM] agent_uav_rw_4 batt=75% alt=141m vel=12m/s
[BRAIN][TELM] agent_uav_rw_2 batt=88% alt=151m vel=7m/s
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=37
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=37 encrypt=on
[BRAIN][TELM] agent_uav_rw_3 batt=73% alt=120m vel=10m/s
[BRAIN][TELM] agent_uav_rw_1 batt=67% alt=149m vel=6m/s
[BRAIN][TELM] agent_uav_rw_1 batt=63% alt=158m vel=12m/s
[BRAIN][FORM] reconfiguration trigger | target=V-ECHELON spacing=80m
[BRAIN][CTRL] cmd: formation_change(V-ECHELON)
[ACK][ACK ] agent_uav_rw_4 accepted | sep=80m rtt=46ms
[ACK][ACK ] agent_uav_rw_1 accepted | sep=80m rtt=45ms
[ACK][ACK ] agent_uav_rw_3 accepted | sep=80m rtt=53ms
[BRAIN][TELM] agent_uav_rw_3 batt=92% alt=142m vel=9m/s
[BRAIN][TELM] agent_uav_fw_1 batt=80% alt=141m vel=8m/s
[BRAIN][NET ] mesh health uplink=25Mbps downlink=32Mbps state=stable
[BRAIN][TELM] agent_uav_rw_2 batt=72% alt=157m vel=13m/s
[BRAIN][FORM] reconfiguration trigger | target=COLUMN spacing=60m
[BRAIN][CTRL] cmd: formation_change(COLUMN)
[ACK][ACK ] agent_uav_fw_1 accepted | sep=60m rtt=53ms
[ACK][ACK ] agent_uav_rw_2 accepted | sep=60m rtt=27ms
[ACK][ACK ] agent_uav_rw_3 accepted | sep=60m rtt=43ms
[BRAIN][NET ] mesh health uplink=28Mbps downlink=33Mbps state=degraded
[BRAIN][NET ] policy: rw_2 video mesh->lte | ctrl stays mesh
[BRAIN][NET ] mesh health uplink=28Mbps downlink=35Mbps state=degraded
[BRAIN][NET ] policy: rw_2 video mesh->lte | ctrl stays mesh
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=38
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=38 encrypt=on
[BRAIN][TELM] agent_uav_rw_4 batt=60% alt=112m vel=9m/s
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=39
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=39 encrypt=on
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=40
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=40 encrypt=on
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=41
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=41 encrypt=on
[BRAIN][TELM] agent_uav_rw_3 batt=81% alt=154m vel=9m/s
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=42
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=42 encrypt=on
[BRAIN][EVNT] ground request from=agent_ground_10 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=29ms
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=43
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=43 encrypt=on
[BRAIN][FORM] reconfiguration trigger | target=LINE-ABREAST spacing=120m
[BRAIN][CTRL] cmd: formation_change(LINE-ABREAST)
[ACK][ACK ] agent_uav_rw_1 accepted | sep=120m rtt=55ms
[ACK][ACK ] agent_uav_fw_1 accepted | sep=120m rtt=50ms
[ACK][ACK ] agent_uav_rw_3 accepted | sep=120m rtt=28ms
[BRAIN][TELM] agent_uav_rw_4 batt=70% alt=130m vel=10m/s
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=44
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=44 encrypt=on
[BRAIN][NET ] mesh health uplink=37Mbps downlink=25Mbps state=stable
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=45
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=45 encrypt=on
[BRAIN][TELM] agent_uav_rw_3 batt=77% alt=138m vel=8m/s
[BRAIN][TELM] agent_uav_rw_1 batt=87% alt=114m vel=10m/s
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=46
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=46 encrypt=on
[BRAIN][TELM] agent_uav_rw_3 batt=71% alt=142m vel=13m/s
[BRAIN][NET ] mesh health uplink=45Mbps downlink=26Mbps state=stable
[BRAIN][TELM] agent_uav_rw_1 batt=64% alt=149m vel=8m/s
[BRAIN][TELM] agent_uav_rw_4 batt=75% alt=157m vel=6m/s
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=47
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=47 encrypt=on
[BRAIN][TELM] agent_uav_rw_4 batt=77% alt=105m vel=10m/s
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=48
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=48 encrypt=on
[BRAIN][EVNT] ground request from=agent_ground_11 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=44ms
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=49
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=49 encrypt=on
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=50
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=50 encrypt=on
[BRAIN][TELM] agent_uav_rw_1 batt=71% alt=109m vel=11m/s
[BRAIN][EVNT] ground request from=agent_ground_04 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=36ms
[BRAIN][TELM] agent_uav_rw_1 batt=72% alt=117m vel=11m/s
[BRAIN][TELM] agent_uav_rw_4 batt=78% alt=120m vel=8m/s
[BRAIN][FORM] reconfiguration trigger | target=COLUMN spacing=60m
[BRAIN][CTRL] cmd: formation_change(COLUMN)
[ACK][ACK ] agent_uav_fw_1 accepted | sep=60m rtt=46ms
[ACK][ACK ] agent_uav_rw_4 accepted | sep=60m rtt=33ms
[BRAIN][TELM] agent_uav_rw_4 batt=71% alt=126m vel=12m/s
[BRAIN][TELM] agent_uav_fw_1 batt=68% alt=129m vel=8m/s
[BRAIN][FORM] reconfiguration trigger | target=COLUMN spacing=60m
[BRAIN][CTRL] cmd: formation_change(COLUMN)
[ACK][ACK ] agent_uav_fw_1 accepted | sep=60m rtt=22ms
[ACK][ACK ] agent_uav_rw_2 accepted | sep=60m rtt=54ms
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=51
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=51 encrypt=on
[BRAIN][TELM] agent_uav_rw_4 batt=92% alt=117m vel=6m/s
[BRAIN][TELM] agent_uav_rw_4 batt=64% alt=151m vel=9m/s
[BRAIN][FORM] reconfiguration trigger | target=V-ECHELON spacing=80m
[BRAIN][CTRL] cmd: formation_change(V-ECHELON)
[ACK][ACK ] agent_uav_rw_2 accepted | sep=80m rtt=39ms
[ACK][ACK ] agent_uav_rw_1 accepted | sep=80m rtt=47ms
[ACK][ACK ] agent_uav_rw_3 accepted | sep=80m rtt=41ms
[BRAIN][EVNT] ground request from=agent_ground_09 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=55ms
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=52
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=52 encrypt=on
[BRAIN][TELM] agent_uav_rw_4 batt=68% alt=130m vel=11m/s
[BRAIN][NET ] mesh health uplink=40Mbps downlink=47Mbps state=degraded
[BRAIN][NET ] policy: rw_2 video mesh->lte | ctrl stays mesh
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=53
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=53 encrypt=on
[BRAIN][NET ] mesh health uplink=32Mbps downlink=30Mbps state=stable
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=54
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=54 encrypt=on
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=55
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=55 encrypt=on
[BRAIN][EVNT] ground request from=agent_ground_07 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=28ms
[BRAIN][TELM] agent_uav_fw_1 batt=78% alt=152m vel=7m/s
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=56
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=56 encrypt=on
[BRAIN][NET ] mesh health uplink=44Mbps downlink=26Mbps state=degraded
[BRAIN][NET ] policy: rw_2 video mesh->lte | ctrl stays mesh
[BRAIN][TELM] agent_uav_rw_3 batt=85% alt=112m vel=9m/s
[BRAIN][EVNT] ground request from=agent_ground_05 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=25ms
[BRAIN][NET ] mesh health uplink=41Mbps downlink=26Mbps state=degraded
[BRAIN][NET ] policy: rw_2 video mesh->lte | ctrl stays mesh
[BRAIN][TELM] agent_uav_rw_3 batt=83% alt=160m vel=10m/s
[BRAIN][NET ] mesh health uplink=42Mbps downlink=34Mbps state=degraded
[BRAIN][NET ] policy: rw_2 video mesh->lte | ctrl stays mesh
[BRAIN][TELM] agent_uav_rw_2 batt=80% alt=121m vel=13m/s
[BRAIN][FORM] reconfiguration trigger | target=LINE-ABREAST spacing=120m
[BRAIN][CTRL] cmd: formation_change(LINE-ABREAST)
[ACK][ACK ] agent_uav_rw_4 accepted | sep=120m rtt=51ms
[ACK][ACK ] agent_uav_fw_1 accepted | sep=120m rtt=54ms
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=57
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=57 encrypt=on
[BRAIN][TELM] agent_uav_rw_3 batt=91% alt=110m vel=13m/s
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=58
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=58 encrypt=on
[BRAIN][TELM] agent_uav_rw_4 batt=76% alt=107m vel=14m/s
[BRAIN][EVNT] ground request from=agent_ground_02 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=41ms
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=59
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=59 encrypt=on
[BRAIN][TELM] agent_uav_fw_1 batt=89% alt=144m vel=10m/s
[BRAIN][TELM] agent_uav_fw_1 batt=84% alt=158m vel=12m/s
[BRAIN][TELM] agent_uav_rw_1 batt=81% alt=127m vel=11m/s
[BRAIN][TELM] agent_uav_rw_3 batt=74% alt=158m vel=11m/s
[BRAIN][TELM] agent_uav_rw_4 batt=88% alt=156m vel=13m/s
[BRAIN][TELM] agent_uav_rw_1 batt=66% alt=120m vel=9m/s
[BRAIN][TELM] agent_uav_rw_3 batt=70% alt=128m vel=11m/s
[BRAIN][TELM] agent_uav_rw_2 batt=75% alt=131m vel=10m/s
[BRAIN][FORM] reconfiguration trigger | target=V-ECHELON spacing=80m
[BRAIN][CTRL] cmd: formation_change(V-ECHELON)
[ACK][ACK ] agent_uav_fw_1 accepted | sep=80m rtt=37ms
[ACK][ACK ] agent_uav_rw_4 accepted | sep=80m rtt=29ms
[ACK][ACK ] agent_uav_rw_2 accepted | sep=80m rtt=26ms
[BRAIN][NET ] mesh health uplink=42Mbps downlink=45Mbps state=stable
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=60
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=60 encrypt=on
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=61
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=61 encrypt=on
[BRAIN][TELM] agent_uav_rw_3 batt=68% alt=122m vel=13m/s
[BRAIN][NET ] mesh health uplink=37Mbps downlink=30Mbps state=stable
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=62
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=62 encrypt=on
[BRAIN][TELM] agent_uav_rw_1 batt=63% alt=133m vel=12m/s
[BRAIN][TELM] agent_uav_rw_4 batt=85% alt=152m vel=9m/s
[BRAIN][EVNT] ground request from=agent_ground_09 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=49ms
[BRAIN][NET ] mesh health uplink=43Mbps downlink=32Mbps state=stable
[BRAIN][FORM] reconfiguration trigger | target=LINE-ABREAST spacing=120m
[BRAIN][CTRL] cmd: formation_change(LINE-ABREAST)
[ACK][ACK ] agent_uav_fw_1 accepted | sep=120m rtt=45ms
[ACK][ACK ] agent_uav_rw_4 accepted | sep=120m rtt=19ms
[BRAIN][NET ] mesh health uplink=43Mbps downlink=39Mbps state=degraded
[BRAIN][NET ] policy: rw_2 video mesh->lte | ctrl stays mesh
[BRAIN][TELM] agent_uav_fw_1 batt=73% alt=139m vel=6m/s
[BRAIN][TELM] agent_uav_rw_4 batt=92% alt=120m vel=6m/s
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=63
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=63 encrypt=on
[BRAIN][EVNT] ground request from=agent_ground_06 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=21ms
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=64
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=64 encrypt=on
[BRAIN][EVNT] ground request from=agent_ground_11 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=47ms
[BRAIN][FORM] reconfiguration trigger | target=LINE-ABREAST spacing=120m
[BRAIN][CTRL] cmd: formation_change(LINE-ABREAST)
[ACK][ACK ] agent_uav_rw_1 accepted | sep=120m rtt=30ms
[ACK][ACK ] agent_uav_rw_3 accepted | sep=120m rtt=49ms
[ACK][ACK ] agent_uav_fw_1 accepted | sep=120m rtt=47ms
[ACK][ACK ] agent_uav_rw_4 accepted | sep=120m rtt=34ms
[BRAIN][TELM] agent_uav_rw_2 batt=73% alt=160m vel=8m/s
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=65
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=65 encrypt=on
[BRAIN][FORM] reconfiguration trigger | target=V-ECHELON spacing=80m
[BRAIN][CTRL] cmd: formation_change(V-ECHELON)
[ACK][ACK ] agent_uav_rw_2 accepted | sep=80m rtt=50ms
[ACK][ACK ] agent_uav_rw_1 accepted | sep=80m rtt=27ms
[ACK][ACK ] agent_uav_rw_3 accepted | sep=80m rtt=21ms
[ACK][ACK ] agent_uav_rw_4 accepted | sep=80m rtt=54ms
[BRAIN][FORM] reconfiguration trigger | target=LINE-ABREAST spacing=120m
[BRAIN][CTRL] cmd: formation_change(LINE-ABREAST)
[ACK][ACK ] agent_uav_fw_1 accepted | sep=120m rtt=52ms
[ACK][ACK ] agent_uav_rw_4 accepted | sep=120m rtt=28ms
[BRAIN][TELM] agent_uav_rw_1 batt=81% alt=141m vel=11m/s
[BRAIN][TELM] agent_uav_rw_1 batt=83% alt=143m vel=7m/s
[BRAIN][TELM] agent_uav_rw_1 batt=77% alt=128m vel=8m/s
[BRAIN][NET ] mesh health uplink=38Mbps downlink=25Mbps state=degraded
[BRAIN][NET ] policy: rw_2 video mesh->lte | ctrl stays mesh
[BRAIN][TELM] agent_uav_rw_4 batt=81% alt=112m vel=10m/s
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=66
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=66 encrypt=on
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=67
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=67 encrypt=on
[BRAIN][TELM] agent_uav_rw_2 batt=91% alt=157m vel=10m/s
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=68
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=68 encrypt=on
[BRAIN][EVNT] ground request from=agent_ground_02 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=34ms
[BRAIN][TELM] agent_uav_rw_2 batt=77% alt=139m vel=9m/s
[BRAIN][EVNT] ground request from=agent_ground_06 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=27ms
[BRAIN][TELM] agent_uav_rw_1 batt=92% alt=110m vel=8m/s
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=69
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=69 encrypt=on
[BRAIN][TELM] agent_uav_rw_3 batt=81% alt=146m vel=7m/s
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=70
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=70 encrypt=on
[BRAIN][NET ] mesh health uplink=40Mbps downlink=34Mbps state=stable
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=71
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=71 encrypt=on
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=72
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=72 encrypt=on
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=73
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=73 encrypt=on
[BRAIN][NET ] mesh health uplink=21Mbps downlink=41Mbps state=degraded
[BRAIN][NET ] policy: rw_2 video mesh->lte | ctrl stays mesh
[BRAIN][EVNT] ground request from=agent_ground_10 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=39ms
[BRAIN][FORM] reconfiguration trigger | target=LINE-ABREAST spacing=120m
[BRAIN][CTRL] cmd: formation_change(LINE-ABREAST)
[ACK][ACK ] agent_uav_rw_3 accepted | sep=120m rtt=48ms
[ACK][ACK ] agent_uav_rw_4 accepted | sep=120m rtt=31ms
[ACK][ACK ] agent_uav_fw_1 accepted | sep=120m rtt=33ms
[BRAIN][TELM] agent_uav_rw_3 batt=61% alt=123m vel=8m/s
[BRAIN][TELM] agent_uav_rw_4 batt=86% alt=130m vel=12m/s
[BRAIN][NET ] mesh health uplink=33Mbps downlink=42Mbps state=degraded
[BRAIN][NET ] policy: rw_2 video mesh->lte | ctrl stays mesh
[BRAIN][NET ] mesh health uplink=22Mbps downlink=32Mbps state=degraded
[BRAIN][NET ] policy: rw_2 video mesh->lte | ctrl stays mesh
[BRAIN][FORM] reconfiguration trigger | target=LINE-ABREAST spacing=120m
[BRAIN][CTRL] cmd: formation_change(LINE-ABREAST)
[ACK][ACK ] agent_uav_rw_2 accepted | sep=120m rtt=48ms
[ACK][ACK ] agent_uav_fw_1 accepted | sep=120m rtt=51ms
[BRAIN][NET ] mesh health uplink=26Mbps downlink=35Mbps state=degraded
[BRAIN][NET ] policy: rw_2 video mesh->lte | ctrl stays mesh
[BRAIN][FORM] reconfiguration trigger | target=LINE-ABREAST spacing=120m
[BRAIN][CTRL] cmd: formation_change(LINE-ABREAST)
[ACK][ACK ] agent_uav_rw_4 accepted | sep=120m rtt=53ms
[ACK][ACK ] agent_uav_fw_1 accepted | sep=120m rtt=54ms
[ACK][ACK ] agent_uav_rw_3 accepted | sep=120m rtt=41ms
[BRAIN][TELM] agent_uav_fw_1 batt=65% alt=105m vel=10m/s
[BRAIN][TELM] agent_uav_rw_3 batt=71% alt=128m vel=7m/s
[BRAIN][TELM] agent_uav_rw_1 batt=72% alt=140m vel=13m/s
[BRAIN][NET ] mesh health uplink=30Mbps downlink=30Mbps state=degraded
[BRAIN][NET ] policy: rw_2 video mesh->lte | ctrl stays mesh
[BRAIN][EVNT] ground request from=agent_ground_05 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=21ms
[BRAIN][FORM] reconfiguration trigger | target=V-ECHELON spacing=80m
[BRAIN][CTRL] cmd: formation_change(V-ECHELON)
[ACK][ACK ] agent_uav_fw_1 accepted | sep=80m rtt=46ms
[ACK][ACK ] agent_uav_rw_4 accepted | sep=80m rtt=21ms
[BRAIN][TELM] agent_uav_rw_1 batt=66% alt=135m vel=13m/s
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=74
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=74 encrypt=on
[BRAIN][EVNT] ground request from=agent_ground_05 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=29ms
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=75
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=75 encrypt=on
[BRAIN][TELM] agent_uav_rw_4 batt=72% alt=133m vel=9m/s
[BRAIN][TELM] agent_uav_rw_1 batt=84% alt=149m vel=10m/s
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=76
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=76 encrypt=on
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=77
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=77 encrypt=on
[BRAIN][FORM] reconfiguration trigger | target=DIAMOND spacing=90m
[BRAIN][CTRL] cmd: formation_change(DIAMOND)
[ACK][ACK ] agent_uav_rw_2 accepted | sep=90m rtt=36ms
[ACK][ACK ] agent_uav_rw_3 accepted | sep=90m rtt=28ms
[ACK][ACK ] agent_uav_rw_4 accepted | sep=90m rtt=54ms
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=78
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=78 encrypt=on
[BRAIN][TELM] agent_uav_rw_4 batt=61% alt=135m vel=14m/s
[BRAIN][TELM] agent_uav_rw_2 batt=84% alt=148m vel=12m/s
[BRAIN][EVNT] ground request from=agent_ground_01 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=39ms
[BRAIN][EVNT] ground request from=agent_ground_03 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=38ms
[BRAIN][EVNT] ground request from=agent_ground_11 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=41ms
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=79
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=79 encrypt=on
[BRAIN][TELM] agent_uav_fw_1 batt=71% alt=106m vel=7m/s
[BRAIN][NET ] mesh health uplink=36Mbps downlink=48Mbps state=stable
[BRAIN][NET ] mesh health uplink=33Mbps downlink=43Mbps state=stable
[BRAIN][TELM] agent_uav_rw_3 batt=89% alt=160m vel=14m/s
[BRAIN][TELM] agent_uav_rw_1 batt=69% alt=101m vel=12m/s
[BRAIN][TELM] agent_uav_rw_3 batt=80% alt=139m vel=7m/s
[BRAIN][TELM] agent_uav_rw_1 batt=68% alt=149m vel=14m/s
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=80
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=80 encrypt=on
[BRAIN][TELM] agent_uav_rw_4 batt=90% alt=121m vel=14m/s
[BRAIN][NET ] mesh health uplink=41Mbps downlink=45Mbps state=degraded
[BRAIN][NET ] policy: rw_2 video mesh->lte | ctrl stays mesh
[BRAIN][TELM] agent_uav_rw_2 batt=64% alt=116m vel=6m/s
[BRAIN][FORM] reconfiguration trigger | target=V-ECHELON spacing=80m
[BRAIN][CTRL] cmd: formation_change(V-ECHELON)
[ACK][ACK ] agent_uav_rw_2 accepted | sep=80m rtt=25ms
[ACK][ACK ] agent_uav_rw_1 accepted | sep=80m rtt=22ms
[ACK][ACK ] agent_uav_rw_4 accepted | sep=80m rtt=24ms
[BRAIN][TELM] agent_uav_rw_1 batt=83% alt=101m vel=9m/s
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=81
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=81 encrypt=on
[BRAIN][EVNT] ground request from=agent_ground_03 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=27ms
[BRAIN][TELM] agent_uav_rw_4 batt=72% alt=114m vel=8m/s
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=82
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=82 encrypt=on
[BRAIN][TELM] agent_uav_fw_1 batt=80% alt=156m vel=9m/s
[BRAIN][NET ] mesh health uplink=30Mbps downlink=41Mbps state=degraded
[BRAIN][NET ] policy: rw_2 video mesh->lte | ctrl stays mesh
[BRAIN][TELM] agent_uav_rw_3 batt=61% alt=106m vel=12m/s
[BRAIN][NET ] mesh health uplink=32Mbps downlink=31Mbps state=degraded
[BRAIN][NET ] policy: rw_2 video mesh->lte | ctrl stays mesh
[BRAIN][FORM] reconfiguration trigger | target=DIAMOND spacing=90m
[BRAIN][CTRL] cmd: formation_change(DIAMOND)
[ACK][ACK ] agent_uav_fw_1 accepted | sep=90m rtt=46ms
[ACK][ACK ] agent_uav_rw_1 accepted | sep=90m rtt=35ms
[ACK][ACK ] agent_uav_rw_2 accepted | sep=90m rtt=20ms
[BRAIN][TELM] agent_uav_rw_2 batt=61% alt=140m vel=10m/s
[BRAIN][TELM] agent_uav_rw_4 batt=62% alt=112m vel=14m/s
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=83
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=83 encrypt=on
[BRAIN][NET ] mesh health uplink=40Mbps downlink=45Mbps state=degraded
[BRAIN][NET ] policy: rw_2 video mesh->lte | ctrl stays mesh
[BRAIN][TELM] agent_uav_rw_2 batt=63% alt=122m vel=14m/s
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=84
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=84 encrypt=on
[BRAIN][TELM] agent_uav_fw_1 batt=62% alt=147m vel=14m/s
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=85
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=85 encrypt=on
[BRAIN][TELM] agent_uav_rw_1 batt=74% alt=160m vel=13m/s
[BRAIN][NET ] mesh health uplink=36Mbps downlink=31Mbps state=degraded
[BRAIN][NET ] policy: rw_2 video mesh->lte | ctrl stays mesh
[BRAIN][TELM] agent_uav_rw_2 batt=86% alt=145m vel=6m/s
[BRAIN][FORM] reconfiguration trigger | target=COLUMN spacing=60m
[BRAIN][CTRL] cmd: formation_change(COLUMN)
[ACK][ACK ] agent_uav_rw_4 accepted | sep=60m rtt=24ms
[ACK][ACK ] agent_uav_fw_1 accepted | sep=60m rtt=23ms
[BRAIN][NET ] mesh health uplink=31Mbps downlink=30Mbps state=stable
[BRAIN][TELM] agent_uav_rw_2 batt=80% alt=156m vel=13m/s
[BRAIN][NET ] mesh health uplink=32Mbps downlink=49Mbps state=degraded
[BRAIN][NET ] policy: rw_2 video mesh->lte | ctrl stays mesh
[BRAIN][TELM] agent_uav_fw_1 batt=76% alt=109m vel=7m/s
[BRAIN][NET ] mesh health uplink=43Mbps downlink=46Mbps state=degraded
[BRAIN][NET ] policy: rw_2 video mesh->lte | ctrl stays mesh
[BRAIN][EVNT] ground request from=agent_ground_06 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=31ms
[BRAIN][NET ] mesh health uplink=30Mbps downlink=46Mbps state=stable
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=86
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=86 encrypt=on
[BRAIN][EVNT] ground request from=agent_ground_03 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=29ms
[BRAIN][FORM] reconfiguration trigger | target=V-ECHELON spacing=80m
[BRAIN][CTRL] cmd: formation_change(V-ECHELON)
[ACK][ACK ] agent_uav_rw_2 accepted | sep=80m rtt=25ms
[ACK][ACK ] agent_uav_rw_3 accepted | sep=80m rtt=48ms
[ACK][ACK ] agent_uav_rw_1 accepted | sep=80m rtt=34ms
[BRAIN][NET ] mesh health uplink=35Mbps downlink=47Mbps state=degraded
[BRAIN][NET ] policy: rw_2 video mesh->lte | ctrl stays mesh
[BRAIN][TELM] agent_uav_rw_4 batt=65% alt=159m vel=14m/s
[BRAIN][TELM] agent_uav_fw_1 batt=88% alt=146m vel=11m/s
[BRAIN][FORM] reconfiguration trigger | target=LINE-ABREAST spacing=120m
[BRAIN][CTRL] cmd: formation_change(LINE-ABREAST)
[ACK][ACK ] agent_uav_rw_1 accepted | sep=120m rtt=23ms
[ACK][ACK ] agent_uav_rw_4 accepted | sep=120m rtt=46ms
[ACK][ACK ] agent_uav_fw_1 accepted | sep=120m rtt=38ms
[BRAIN][NET ] mesh health uplink=22Mbps downlink=29Mbps state=stable
[BRAIN][TELM] agent_uav_rw_4 batt=81% alt=156m vel=11m/s
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=87
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=87 encrypt=on
[BRAIN][NET ] mesh health uplink=30Mbps downlink=31Mbps state=degraded
[BRAIN][NET ] policy: rw_2 video mesh->lte | ctrl stays mesh
[BRAIN][NET ] mesh health uplink=26Mbps downlink=49Mbps state=degraded
[BRAIN][NET ] policy: rw_2 video mesh->lte | ctrl stays mesh
[BRAIN][TELM] agent_uav_rw_4 batt=69% alt=124m vel=8m/s
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=88
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=88 encrypt=on
[BRAIN][TELM] agent_uav_fw_1 batt=69% alt=150m vel=8m/s
[BRAIN][TELM] agent_uav_rw_3 batt=85% alt=150m vel=6m/s
[BRAIN][NET ] mesh health uplink=24Mbps downlink=30Mbps state=degraded
[BRAIN][NET ] policy: rw_2 video mesh->lte | ctrl stays mesh
[BRAIN][TELM] agent_uav_rw_4 batt=71% alt=119m vel=14m/s
[BRAIN][EVNT] ground request from=agent_ground_05 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=31ms
[BRAIN][EVNT] ground request from=agent_ground_01 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=49ms
[BRAIN][TELM] agent_uav_rw_4 batt=82% alt=119m vel=14m/s
[BRAIN][EVNT] ground request from=agent_ground_12 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=27ms
[BRAIN][NET ] mesh health uplink=38Mbps downlink=47Mbps state=stable
[BRAIN][TELM] agent_uav_rw_2 batt=85% alt=159m vel=13m/s
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=89
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=89 encrypt=on
[BRAIN][EVNT] ground request from=agent_ground_04 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=49ms
[BRAIN][TELM] agent_uav_rw_2 batt=62% alt=113m vel=13m/s
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=90
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=90 encrypt=on
[BRAIN][TELM] agent_uav_fw_1 batt=65% alt=138m vel=14m/s
[BRAIN][TELM] agent_uav_rw_2 batt=87% alt=157m vel=7m/s
[BRAIN][NET ] mesh health uplink=30Mbps downlink=31Mbps state=stable
[BRAIN][EVNT] ground request from=agent_ground_11 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=35ms
[BRAIN][TELM] agent_uav_rw_2 batt=62% alt=100m vel=8m/s
[BRAIN][EVNT] ground request from=agent_ground_06 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=44ms
[BRAIN][TELM] agent_uav_rw_4 batt=72% alt=143m vel=6m/s
[BRAIN][NET ] mesh health uplink=28Mbps downlink=42Mbps state=stable
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=91
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=91 encrypt=on
[BRAIN][NET ] mesh health uplink=34Mbps downlink=33Mbps state=degraded
[BRAIN][NET ] policy: rw_2 video mesh->lte | ctrl stays mesh
[BRAIN][TELM] agent_uav_rw_2 batt=79% alt=125m vel=8m/s
[BRAIN][NET ] mesh health uplink=30Mbps downlink=36Mbps state=stable
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=92
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=92 encrypt=on
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=93
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=93 encrypt=on
[BRAIN][TELM] agent_uav_rw_4 batt=63% alt=119m vel=6m/s
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=94
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=94 encrypt=on
[BRAIN][NET ] mesh health uplink=35Mbps downlink=45Mbps state=degraded
[BRAIN][NET ] policy: rw_2 video mesh->lte | ctrl stays mesh
[BRAIN][TELM] agent_uav_rw_4 batt=62% alt=112m vel=8m/s
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=95
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=95 encrypt=on
[BRAIN][EVNT] ground request from=agent_ground_06 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=54ms
[BRAIN][TELM] agent_uav_rw_2 batt=76% alt=142m vel=12m/s
[BRAIN][TELM] agent_uav_rw_4 batt=64% alt=127m vel=6m/s
[BRAIN][TELM] agent_uav_fw_1 batt=79% alt=138m vel=10m/s
[BRAIN][TELM] agent_uav_fw_1 batt=82% alt=105m vel=12m/s
[BRAIN][TELM] agent_uav_rw_3 batt=83% alt=101m vel=8m/s
[BRAIN][TELM] agent_uav_rw_3 batt=78% alt=137m vel=11m/s
[BRAIN][TELM] agent_uav_fw_1 batt=62% alt=137m vel=9m/s
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=96
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=96 encrypt=on
[BRAIN][NET ] mesh health uplink=27Mbps downlink=28Mbps state=degraded
[BRAIN][NET ] policy: rw_2 video mesh->lte | ctrl stays mesh
[BRAIN][TELM] agent_uav_rw_1 batt=80% alt=160m vel=6m/s
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=97
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=97 encrypt=on
[BRAIN][TELM] agent_uav_rw_3 batt=86% alt=123m vel=9m/s
[BRAIN][TELM] agent_uav_rw_3 batt=61% alt=113m vel=12m/s
[BRAIN][TELM] agent_uav_fw_1 batt=75% alt=108m vel=10m/s
[BRAIN][NET ] mesh health uplink=27Mbps downlink=36Mbps state=stable
[BRAIN][EVNT] ground request from=agent_ground_05 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=47ms
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=98
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=98 encrypt=on
[BRAIN][FORM] reconfiguration trigger | target=LINE-ABREAST spacing=120m
[BRAIN][CTRL] cmd: formation_change(LINE-ABREAST)
[ACK][ACK ] agent_uav_rw_4 accepted | sep=120m rtt=29ms
[ACK][ACK ] agent_uav_rw_3 accepted | sep=120m rtt=40ms
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=99
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=99 encrypt=on
[BRAIN][FORM] reconfiguration trigger | target=COLUMN spacing=60m
[BRAIN][CTRL] cmd: formation_change(COLUMN)
[ACK][ACK ] agent_uav_rw_4 accepted | sep=60m rtt=24ms
[ACK][ACK ] agent_uav_rw_2 accepted | sep=60m rtt=51ms
[ACK][ACK ] agent_uav_fw_1 accepted | sep=60m rtt=41ms
[ACK][ACK ] agent_uav_rw_3 accepted | sep=60m rtt=54ms
[BRAIN][EVNT] ground request from=agent_ground_04 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=18ms
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=100
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=100 encrypt=on
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=101
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=101 encrypt=on
[BRAIN][TELM] agent_uav_rw_1 batt=73% alt=119m vel=8m/s
[BRAIN][EVNT] ground request from=agent_ground_07 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=35ms
[BRAIN][FORM] reconfiguration trigger | target=COLUMN spacing=60m
[BRAIN][CTRL] cmd: formation_change(COLUMN)
[ACK][ACK ] agent_uav_rw_3 accepted | sep=60m rtt=30ms
[ACK][ACK ] agent_uav_rw_2 accepted | sep=60m rtt=27ms
[ACK][ACK ] agent_uav_rw_1 accepted | sep=60m rtt=21ms
[BRAIN][EVNT] ground request from=agent_ground_04 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=28ms
[BRAIN][TELM] agent_uav_rw_4 batt=89% alt=112m vel=13m/s
[BRAIN][TELM] agent_uav_rw_3 batt=80% alt=144m vel=8m/s
[BRAIN][TELM] agent_uav_rw_3 batt=68% alt=134m vel=6m/s
[BRAIN][TELM] agent_uav_rw_1 batt=73% alt=144m vel=7m/s
[BRAIN][EVNT] ground request from=agent_ground_07 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=28ms
[BRAIN][TELM] agent_uav_rw_2 batt=83% alt=105m vel=10m/s
[BRAIN][TELM] agent_uav_fw_1 batt=63% alt=113m vel=11m/s
[BRAIN][TELM] agent_uav_rw_2 batt=78% alt=142m vel=10m/s
[BRAIN][TELM] agent_uav_rw_2 batt=75% alt=134m vel=12m/s
[BRAIN][TELM] agent_uav_rw_2 batt=85% alt=127m vel=10m/s
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=102
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=102 encrypt=on
[BRAIN][TELM] agent_uav_rw_2 batt=74% alt=134m vel=7m/s
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=103
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=103 encrypt=on
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=104
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=104 encrypt=on
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=105
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=105 encrypt=on
[BRAIN][NET ] mesh health uplink=31Mbps downlink=34Mbps state=stable
[BRAIN][FORM] reconfiguration trigger | target=DIAMOND spacing=90m
[BRAIN][CTRL] cmd: formation_change(DIAMOND)
[ACK][ACK ] agent_uav_rw_1 accepted | sep=90m rtt=28ms
[ACK][ACK ] agent_uav_rw_4 accepted | sep=90m rtt=44ms
[ACK][ACK ] agent_uav_fw_1 accepted | sep=90m rtt=54ms
[BRAIN][TELM] agent_uav_rw_2 batt=61% alt=102m vel=7m/s
[BRAIN][FORM] reconfiguration trigger | target=LINE-ABREAST spacing=120m
[BRAIN][CTRL] cmd: formation_change(LINE-ABREAST)
[ACK][ACK ] agent_uav_rw_2 accepted | sep=120m rtt=49ms
[ACK][ACK ] agent_uav_rw_1 accepted | sep=120m rtt=38ms
[ACK][ACK ] agent_uav_fw_1 accepted | sep=120m rtt=52ms
[BRAIN][NET ] mesh health uplink=27Mbps downlink=41Mbps state=stable
[BRAIN][TELM] agent_uav_fw_1 batt=62% alt=102m vel=11m/s
[BRAIN][NET ] mesh health uplink=22Mbps downlink=44Mbps state=stable
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=106
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=106 encrypt=on
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=107
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=107 encrypt=on
[BRAIN][TELM] agent_uav_rw_3 batt=65% alt=116m vel=9m/s
[BRAIN][TELM] agent_uav_rw_1 batt=89% alt=158m vel=12m/s
[BRAIN][TELM] agent_uav_rw_4 batt=76% alt=111m vel=13m/s
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=108
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=108 encrypt=on
[BRAIN][TELM] agent_uav_rw_2 batt=70% alt=140m vel=11m/s
[BRAIN][TELM] agent_uav_rw_2 batt=92% alt=154m vel=10m/s
[BRAIN][TELM] agent_uav_rw_4 batt=88% alt=124m vel=11m/s
[BRAIN][TELM] agent_uav_rw_2 batt=67% alt=121m vel=9m/s
[BRAIN][TELM] agent_uav_rw_4 batt=68% alt=155m vel=7m/s
[BRAIN][TELM] agent_uav_fw_1 batt=82% alt=159m vel=11m/s
[BRAIN][FORM] reconfiguration trigger | target=DIAMOND spacing=90m
[BRAIN][CTRL] cmd: formation_change(DIAMOND)
[ACK][ACK ] agent_uav_rw_3 accepted | sep=90m rtt=41ms
[ACK][ACK ] agent_uav_rw_2 accepted | sep=90m rtt=32ms
[ACK][ACK ] agent_uav_rw_1 accepted | sep=90m rtt=39ms
[ACK][ACK ] agent_uav_fw_1 accepted | sep=90m rtt=22ms
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=109
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=109 encrypt=on
[BRAIN][TELM] agent_uav_rw_4 batt=68% alt=132m vel=7m/s
[BRAIN][TELM] agent_uav_rw_3 batt=80% alt=121m vel=7m/s
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=110
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=110 encrypt=on
[BRAIN][FORM] reconfiguration trigger | target=V-ECHELON spacing=80m
[BRAIN][CTRL] cmd: formation_change(V-ECHELON)
[ACK][ACK ] agent_uav_rw_4 accepted | sep=80m rtt=27ms
[ACK][ACK ] agent_uav_rw_2 accepted | sep=80m rtt=38ms
[ACK][ACK ] agent_uav_rw_3 accepted | sep=80m rtt=28ms
[BRAIN][FORM] reconfiguration trigger | target=DIAMOND spacing=90m
[BRAIN][CTRL] cmd: formation_change(DIAMOND)
[ACK][ACK ] agent_uav_rw_3 accepted | sep=90m rtt=22ms
[ACK][ACK ] agent_uav_fw_1 accepted | sep=90m rtt=38ms
[BRAIN][TELM] agent_uav_rw_2 batt=84% alt=154m vel=10m/s
[BRAIN][TELM] agent_uav_rw_1 batt=60% alt=135m vel=14m/s
[BRAIN][TELM] agent_uav_fw_1 batt=80% alt=114m vel=9m/s
[BRAIN][EVNT] ground request from=agent_ground_07 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=38ms
[BRAIN][TELM] agent_uav_rw_3 batt=88% alt=125m vel=11m/s
[BRAIN][TELM] agent_uav_rw_2 batt=76% alt=103m vel=12m/s
[BRAIN][TELM] agent_uav_rw_3 batt=90% alt=140m vel=7m/s
[BRAIN][TELM] agent_uav_rw_2 batt=79% alt=158m vel=7m/s
[BRAIN][TELM] agent_uav_rw_2 batt=68% alt=132m vel=7m/s
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=111
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=111 encrypt=on
[BRAIN][TELM] agent_uav_rw_3 batt=73% alt=121m vel=8m/s
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=112
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=112 encrypt=on
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=113
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=113 encrypt=on
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=114
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=114 encrypt=on
[BRAIN][TELM] agent_uav_rw_4 batt=90% alt=106m vel=7m/s
[BRAIN][FORM] reconfiguration trigger | target=LINE-ABREAST spacing=120m
[BRAIN][CTRL] cmd: formation_change(LINE-ABREAST)
[ACK][ACK ] agent_uav_rw_3 accepted | sep=120m rtt=30ms
[ACK][ACK ] agent_uav_fw_1 accepted | sep=120m rtt=51ms
[ACK][ACK ] agent_uav_rw_2 accepted | sep=120m rtt=51ms
[ACK][ACK ] agent_uav_rw_1 accepted | sep=120m rtt=48ms
[BRAIN][NET ] mesh health uplink=37Mbps downlink=43Mbps state=stable
[BRAIN][TELM] agent_uav_fw_1 batt=66% alt=146m vel=6m/s
[BRAIN][NET ] mesh health uplink=43Mbps downlink=48Mbps state=stable
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=115
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=115 encrypt=on
[BRAIN][EVNT] ground request from=agent_ground_07 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=39ms
[BRAIN][TELM] agent_uav_rw_1 batt=74% alt=108m vel=9m/s
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=116
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=116 encrypt=on
[BRAIN][EVNT] ground request from=agent_ground_06 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=50ms
[BRAIN][NET ] mesh health uplink=35Mbps downlink=47Mbps state=degraded
[BRAIN][NET ] policy: rw_2 video mesh->lte | ctrl stays mesh
[BRAIN][NET ] mesh health uplink=26Mbps downlink=40Mbps state=stable
[BRAIN][TELM] agent_uav_rw_4 batt=91% alt=159m vel=10m/s
[BRAIN][TELM] agent_uav_rw_4 batt=82% alt=137m vel=6m/s
[BRAIN][EVNT] ground request from=agent_ground_04 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=42ms
[BRAIN][TELM] agent_uav_fw_1 batt=64% alt=116m vel=6m/s
[BRAIN][TELM] agent_uav_rw_3 batt=68% alt=109m vel=6m/s
[BRAIN][TELM] agent_uav_rw_2 batt=86% alt=144m vel=7m/s
[BRAIN][TELM] agent_uav_rw_1 batt=67% alt=150m vel=14m/s
[BRAIN][TELM] agent_uav_rw_2 batt=86% alt=157m vel=7m/s
[BRAIN][TELM] agent_uav_rw_2 batt=71% alt=157m vel=10m/s
[BRAIN][TELM] agent_uav_rw_1 batt=91% alt=148m vel=13m/s
[BRAIN][TELM] agent_uav_rw_1 batt=85% alt=154m vel=13m/s
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=117
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=117 encrypt=on
[BRAIN][TELM] agent_uav_rw_2 batt=65% alt=157m vel=12m/s
[BRAIN][TELM] agent_uav_rw_4 batt=71% alt=146m vel=12m/s
[BRAIN][TELM] agent_uav_fw_1 batt=62% alt=117m vel=8m/s
[BRAIN][NET ] mesh health uplink=29Mbps downlink=38Mbps state=stable
[BRAIN][NET ] mesh health uplink=45Mbps downlink=40Mbps state=degraded
[BRAIN][NET ] policy: rw_2 video mesh->lte | ctrl stays mesh
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=118
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=118 encrypt=on
[BRAIN][TELM] agent_uav_fw_1 batt=91% alt=147m vel=10m/s
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=119
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=119 encrypt=on
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=120
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=120 encrypt=on
[BRAIN][FORM] reconfiguration trigger | target=COLUMN spacing=60m
[BRAIN][CTRL] cmd: formation_change(COLUMN)
[ACK][ACK ] agent_uav_rw_3 accepted | sep=60m rtt=25ms
[ACK][ACK ] agent_uav_fw_1 accepted | sep=60m rtt=53ms
[ACK][ACK ] agent_uav_rw_4 accepted | sep=60m rtt=47ms
[ACK][ACK ] agent_uav_rw_1 accepted | sep=60m rtt=20ms
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=121
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=121 encrypt=on
[BRAIN][TELM] agent_uav_fw_1 batt=76% alt=143m vel=6m/s
[BRAIN][NET ] mesh health uplink=39Mbps downlink=32Mbps state=stable
[BRAIN][TELM] agent_uav_fw_1 batt=67% alt=104m vel=9m/s
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=122
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=122 encrypt=on
[BRAIN][TELM] agent_uav_rw_2 batt=60% alt=104m vel=12m/s
[BRAIN][NET ] mesh health uplink=43Mbps downlink=43Mbps state=degraded
[BRAIN][NET ] policy: rw_2 video mesh->lte | ctrl stays mesh
[BRAIN][EVNT] ground request from=agent_ground_09 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=41ms
[BRAIN][TELM] agent_uav_rw_3 batt=76% alt=159m vel=6m/s
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=123
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=123 encrypt=on
[BRAIN][EVNT] ground request from=agent_ground_10 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=45ms
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=124
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=124 encrypt=on
[BRAIN][NET ] mesh health uplink=33Mbps downlink=47Mbps state=stable
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=125
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=125 encrypt=on
[BRAIN][TELM] agent_uav_fw_1 batt=79% alt=108m vel=7m/s
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=126
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=126 encrypt=on
[BRAIN][TELM] agent_uav_rw_3 batt=89% alt=104m vel=10m/s
[BRAIN][TELM] agent_uav_fw_1 batt=77% alt=143m vel=14m/s
[BRAIN][NET ] mesh health uplink=39Mbps downlink=44Mbps state=stable
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=127
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=127 encrypt=on
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=128
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=128 encrypt=on
[BRAIN][NET ] mesh health uplink=40Mbps downlink=27Mbps state=stable
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=129
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=129 encrypt=on
[BRAIN][TELM] agent_uav_rw_2 batt=88% alt=146m vel=10m/s
[BRAIN][TELM] agent_uav_rw_2 batt=74% alt=135m vel=6m/s
[BRAIN][NET ] mesh health uplink=20Mbps downlink=38Mbps state=degraded
[BRAIN][NET ] policy: rw_2 video mesh->lte | ctrl stays mesh
[BRAIN][NET ] mesh health uplink=44Mbps downlink=49Mbps state=degraded
[BRAIN][NET ] policy: rw_2 video mesh->lte | ctrl stays mesh
[BRAIN][EVNT] ground request from=agent_ground_05 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=26ms
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=130
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=130 encrypt=on
[BRAIN][EVNT] ground request from=agent_ground_03 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=54ms
[BRAIN][TELM] agent_uav_rw_3 batt=82% alt=117m vel=10m/s
[BRAIN][EVNT] ground request from=agent_ground_06 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=20ms
[BRAIN][TELM] agent_uav_rw_1 batt=62% alt=120m vel=6m/s
[BRAIN][TELM] agent_uav_fw_1 batt=62% alt=127m vel=10m/s
[BRAIN][EVNT] ground request from=agent_ground_06 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=28ms
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=131
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=131 encrypt=on
[BRAIN][NET ] mesh health uplink=33Mbps downlink=33Mbps state=degraded
[BRAIN][NET ] policy: rw_2 video mesh->lte | ctrl stays mesh
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=132
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=132 encrypt=on
[BRAIN][TELM] agent_uav_rw_2 batt=62% alt=133m vel=13m/s
[BRAIN][TELM] agent_uav_rw_4 batt=64% alt=100m vel=10m/s
[BRAIN][TELM] agent_uav_rw_4 batt=85% alt=120m vel=8m/s
[BRAIN][FORM] reconfiguration trigger | target=COLUMN spacing=60m
[BRAIN][CTRL] cmd: formation_change(COLUMN)
[ACK][ACK ] agent_uav_rw_1 accepted | sep=60m rtt=25ms
[ACK][ACK ] agent_uav_fw_1 accepted | sep=60m rtt=38ms
[BRAIN][EVNT] ground request from=agent_ground_08 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=21ms
[BRAIN][FORM] reconfiguration trigger | target=LINE-ABREAST spacing=120m
[BRAIN][CTRL] cmd: formation_change(LINE-ABREAST)
[ACK][ACK ] agent_uav_rw_1 accepted | sep=120m rtt=21ms
[ACK][ACK ] agent_uav_rw_2 accepted | sep=120m rtt=50ms
[ACK][ACK ] agent_uav_rw_3 accepted | sep=120m rtt=39ms
[ACK][ACK ] agent_uav_fw_1 accepted | sep=120m rtt=40ms
[BRAIN][TELM] agent_uav_rw_1 batt=86% alt=117m vel=13m/s
[BRAIN][TELM] agent_uav_rw_2 batt=62% alt=148m vel=12m/s
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=133
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=133 encrypt=on
[BRAIN][TELM] agent_uav_rw_2 batt=89% alt=138m vel=12m/s
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=134
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=134 encrypt=on
[BRAIN][EVNT] ground request from=agent_ground_05 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=23ms
[BRAIN][TELM] agent_uav_fw_1 batt=69% alt=106m vel=11m/s
[BRAIN][TELM] agent_uav_rw_1 batt=73% alt=133m vel=12m/s
[BRAIN][FORM] reconfiguration trigger | target=DIAMOND spacing=90m
[BRAIN][CTRL] cmd: formation_change(DIAMOND)
[ACK][ACK ] agent_uav_rw_3 accepted | sep=90m rtt=47ms
[ACK][ACK ] agent_uav_rw_2 accepted | sep=90m rtt=21ms
[ACK][ACK ] agent_uav_fw_1 accepted | sep=90m rtt=46ms
[ACK][ACK ] agent_uav_rw_1 accepted | sep=90m rtt=35ms
[BRAIN][FORM] reconfiguration trigger | target=LINE-ABREAST spacing=120m
[BRAIN][CTRL] cmd: formation_change(LINE-ABREAST)
[ACK][ACK ] agent_uav_fw_1 accepted | sep=120m rtt=51ms
[ACK][ACK ] agent_uav_rw_3 accepted | sep=120m rtt=33ms
[BRAIN][TELM] agent_uav_rw_4 batt=87% alt=143m vel=8m/s
[BRAIN][FORM] reconfiguration trigger | target=COLUMN spacing=60m
[BRAIN][CTRL] cmd: formation_change(COLUMN)
[ACK][ACK ] agent_uav_fw_1 accepted | sep=60m rtt=25ms
[ACK][ACK ] agent_uav_rw_3 accepted | sep=60m rtt=28ms
[BRAIN][TELM] agent_uav_rw_2 batt=62% alt=127m vel=9m/s
[BRAIN][TELM] agent_uav_fw_1 batt=81% alt=142m vel=13m/s
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=135
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=135 encrypt=on
[BRAIN][TELM] agent_uav_fw_1 batt=85% alt=113m vel=14m/s
[BRAIN][TELM] agent_uav_rw_1 batt=90% alt=100m vel=6m/s
[BRAIN][TELM] agent_uav_fw_1 batt=71% alt=146m vel=6m/s
[BRAIN][TELM] agent_uav_rw_2 batt=68% alt=120m vel=10m/s
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=136
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=136 encrypt=on
[BRAIN][FORM] reconfiguration trigger | target=DIAMOND spacing=90m
[BRAIN][CTRL] cmd: formation_change(DIAMOND)
[ACK][ACK ] agent_uav_rw_1 accepted | sep=90m rtt=52ms
[ACK][ACK ] agent_uav_rw_2 accepted | sep=90m rtt=28ms
[BRAIN][TELM] agent_uav_rw_3 batt=64% alt=102m vel=8m/s
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=137
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=137 encrypt=on
[BRAIN][TELM] agent_uav_fw_1 batt=86% alt=107m vel=12m/s
[BRAIN][TELM] agent_uav_rw_1 batt=83% alt=117m vel=9m/s
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=138
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=138 encrypt=on
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=139
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=139 encrypt=on
[BRAIN][TELM] agent_uav_rw_2 batt=64% alt=160m vel=13m/s
[BRAIN][TELM] agent_uav_rw_2 batt=77% alt=160m vel=8m/s
[BRAIN][TELM] agent_uav_rw_3 batt=73% alt=158m vel=6m/s
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=140
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=140 encrypt=on
[BRAIN][TELM] agent_uav_rw_2 batt=81% alt=118m vel=7m/s
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=141
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=141 encrypt=on
[BRAIN][EVNT] ground request from=agent_ground_01 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=29ms
[BRAIN][TELM] agent_uav_fw_1 batt=88% alt=148m vel=13m/s
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=142
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=142 encrypt=on
[BRAIN][TELM] agent_uav_rw_2 batt=75% alt=127m vel=11m/s
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=143
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=143 encrypt=on
[BRAIN][FORM] reconfiguration trigger | target=LINE-ABREAST spacing=120m
[BRAIN][CTRL] cmd: formation_change(LINE-ABREAST)
[ACK][ACK ] agent_uav_rw_1 accepted | sep=120m rtt=51ms
[ACK][ACK ] agent_uav_rw_3 accepted | sep=120m rtt=34ms
[ACK][ACK ] agent_uav_fw_1 accepted | sep=120m rtt=19ms
[BRAIN][EVNT] ground request from=agent_ground_08 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=37ms
[BRAIN][NET ] mesh health uplink=22Mbps downlink=39Mbps state=stable
[BRAIN][TELM] agent_uav_rw_3 batt=66% alt=124m vel=11m/s
[BRAIN][TELM] agent_uav_rw_4 batt=84% alt=145m vel=12m/s
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=144
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=144 encrypt=on
[BRAIN][TELM] agent_uav_rw_3 batt=61% alt=104m vel=9m/s
[BRAIN][TELM] agent_uav_rw_2 batt=65% alt=134m vel=9m/s
[BRAIN][TELM] agent_uav_rw_3 batt=77% alt=156m vel=8m/s
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=145
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=145 encrypt=on
[BRAIN][TELM] agent_uav_rw_4 batt=78% alt=107m vel=12m/s
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=146
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=146 encrypt=on
[BRAIN][FORM] reconfiguration trigger | target=V-ECHELON spacing=80m
[BRAIN][CTRL] cmd: formation_change(V-ECHELON)
[ACK][ACK ] agent_uav_rw_1 accepted | sep=80m rtt=24ms
[ACK][ACK ] agent_uav_rw_4 accepted | sep=80m rtt=46ms
[ACK][ACK ] agent_uav_rw_3 accepted | sep=80m rtt=18ms
[ACK][ACK ] agent_uav_fw_1 accepted | sep=80m rtt=52ms
[BRAIN][TELM] agent_uav_fw_1 batt=74% alt=121m vel=9m/s
[BRAIN][NET ] mesh health uplink=38Mbps downlink=42Mbps state=stable
[BRAIN][NET ] mesh health uplink=32Mbps downlink=36Mbps state=degraded
[BRAIN][NET ] policy: rw_2 video mesh->lte | ctrl stays mesh
[BRAIN][TELM] agent_uav_rw_3 batt=71% alt=101m vel=8m/s
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=147
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=147 encrypt=on
[BRAIN][NET ] mesh health uplink=25Mbps downlink=40Mbps state=stable
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=148
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=148 encrypt=on
[BRAIN][NET ] mesh health uplink=40Mbps downlink=41Mbps state=stable
[BRAIN][TELM] agent_uav_rw_3 batt=66% alt=105m vel=10m/s
[BRAIN][TELM] agent_uav_rw_1 batt=89% alt=112m vel=6m/s
[BRAIN][TELM] agent_uav_rw_3 batt=84% alt=103m vel=14m/s
[BRAIN][TELM] agent_uav_fw_1 batt=71% alt=138m vel=6m/s
[BRAIN][NET ] mesh health uplink=44Mbps downlink=29Mbps state=stable
[BRAIN][TELM] agent_uav_rw_3 batt=89% alt=124m vel=13m/s
[BRAIN][TELM] agent_uav_rw_1 batt=92% alt=132m vel=9m/s
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=149
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=149 encrypt=on
[BRAIN][TELM] agent_uav_fw_1 batt=66% alt=134m vel=9m/s
[BRAIN][TELM] agent_uav_fw_1 batt=70% alt=104m vel=6m/s
[BRAIN][TELM] agent_uav_fw_1 batt=85% alt=128m vel=6m/s
[BRAIN][EVNT] ground request from=agent_ground_07 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=20ms
[BRAIN][TELM] agent_uav_rw_4 batt=79% alt=127m vel=12m/s
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=150
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=150 encrypt=on
[BRAIN][EVNT] ground request from=agent_ground_09 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=32ms
[BRAIN][FORM] reconfiguration trigger | target=V-ECHELON spacing=80m
[BRAIN][CTRL] cmd: formation_change(V-ECHELON)
[ACK][ACK ] agent_uav_fw_1 accepted | sep=80m rtt=44ms
[ACK][ACK ] agent_uav_rw_3 accepted | sep=80m rtt=45ms
[ACK][ACK ] agent_uav_rw_1 accepted | sep=80m rtt=32ms
[BRAIN][EVNT] ground request from=agent_ground_11 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=41ms
[BRAIN][NET ] mesh health uplink=40Mbps downlink=35Mbps state=degraded
[BRAIN][NET ] policy: rw_2 video mesh->lte | ctrl stays mesh
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=151
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=151 encrypt=on
[BRAIN][TELM] agent_uav_rw_2 batt=71% alt=153m vel=6m/s
[BRAIN][TELM] agent_uav_rw_3 batt=73% alt=152m vel=12m/s
[BRAIN][TELM] agent_uav_rw_2 batt=87% alt=150m vel=9m/s
[BRAIN][TELM] agent_uav_rw_1 batt=67% alt=121m vel=6m/s
[BRAIN][TELM] agent_uav_rw_1 batt=81% alt=100m vel=12m/s
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=152
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=152 encrypt=on
[BRAIN][TELM] agent_uav_rw_1 batt=83% alt=141m vel=8m/s
[BRAIN][TELM] agent_uav_rw_4 batt=76% alt=108m vel=12m/s
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=153
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=153 encrypt=on
[BRAIN][TELM] agent_uav_rw_4 batt=84% alt=131m vel=14m/s
[BRAIN][NET ] mesh health uplink=43Mbps downlink=27Mbps state=stable
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=154
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=154 encrypt=on
[BRAIN][FORM] reconfiguration trigger | target=V-ECHELON spacing=80m
[BRAIN][CTRL] cmd: formation_change(V-ECHELON)
[ACK][ACK ] agent_uav_fw_1 accepted | sep=80m rtt=30ms
[ACK][ACK ] agent_uav_rw_4 accepted | sep=80m rtt=48ms
[BRAIN][TELM] agent_uav_rw_3 batt=73% alt=127m vel=6m/s
[BRAIN][TELM] agent_uav_rw_1 batt=81% alt=104m vel=6m/s
[BRAIN][NET ] mesh health uplink=37Mbps downlink=42Mbps state=degraded
[BRAIN][NET ] policy: rw_2 video mesh->lte | ctrl stays mesh
[BRAIN][TELM] agent_uav_rw_2 batt=85% alt=152m vel=6m/s
[BRAIN][EVNT] ground request from=agent_ground_12 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=34ms
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=155
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=155 encrypt=on
[BRAIN][NET ] mesh health uplink=27Mbps downlink=36Mbps state=degraded
[BRAIN][NET ] policy: rw_2 video mesh->lte | ctrl stays mesh
[BRAIN][TELM] agent_uav_rw_2 batt=84% alt=138m vel=12m/s
[BRAIN][TELM] agent_uav_fw_1 batt=84% alt=148m vel=10m/s
[BRAIN][TELM] agent_uav_fw_1 batt=90% alt=134m vel=7m/s
[BRAIN][TELM] agent_uav_rw_3 batt=84% alt=154m vel=8m/s
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=156
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=156 encrypt=on
[BRAIN][TELM] agent_uav_rw_2 batt=70% alt=107m vel=9m/s
[BRAIN][EVNT] ground request from=agent_ground_09 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=39ms
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=157
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=157 encrypt=on
[BRAIN][EVNT] ground request from=agent_ground_09 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=28ms
[BRAIN][NET ] mesh health uplink=44Mbps downlink=43Mbps state=degraded
[BRAIN][NET ] policy: rw_2 video mesh->lte | ctrl stays mesh
[BRAIN][EVNT] ground request from=agent_ground_03 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=33ms
[BRAIN][NET ] mesh health uplink=25Mbps downlink=36Mbps state=degraded
[BRAIN][NET ] policy: rw_2 video mesh->lte | ctrl stays mesh
[BRAIN][EVNT] ground request from=agent_ground_02 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=21ms
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=158
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=158 encrypt=on
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=159
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=159 encrypt=on
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=160
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=160 encrypt=on
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=161
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=161 encrypt=on
[BRAIN][TELM] agent_uav_rw_1 batt=68% alt=126m vel=6m/s
[BRAIN][TELM] agent_uav_fw_1 batt=81% alt=154m vel=9m/s
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=162
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=162 encrypt=on
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=163
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=163 encrypt=on
[BRAIN][NET ] mesh health uplink=27Mbps downlink=44Mbps state=degraded
[BRAIN][NET ] policy: rw_2 video mesh->lte | ctrl stays mesh
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=164
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=164 encrypt=on
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=165
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=165 encrypt=on
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=166
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=166 encrypt=on
[BRAIN][TELM] agent_uav_rw_2 batt=63% alt=102m vel=11m/s
[BRAIN][EVNT] ground request from=agent_ground_09 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=26ms
[BRAIN][TELM] agent_uav_rw_1 batt=79% alt=117m vel=10m/s
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=167
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=167 encrypt=on
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=168
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=168 encrypt=on
[BRAIN][NET ] mesh health uplink=39Mbps downlink=39Mbps state=stable
[BRAIN][TELM] agent_uav_fw_1 batt=74% alt=121m vel=11m/s
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=169
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=169 encrypt=on
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=170
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=170 encrypt=on
[BRAIN][TELM] agent_uav_rw_4 batt=79% alt=114m vel=14m/s
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=171
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=171 encrypt=on
[BRAIN][TELM] agent_uav_fw_1 batt=71% alt=114m vel=10m/s
[BRAIN][TELM] agent_uav_rw_1 batt=89% alt=110m vel=7m/s
[BRAIN][TELM] agent_uav_fw_1 batt=91% alt=142m vel=10m/s
[BRAIN][EVNT] ground request from=agent_ground_09 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=22ms
[BRAIN][NET ] mesh health uplink=34Mbps downlink=40Mbps state=degraded
[BRAIN][NET ] policy: rw_2 video mesh->lte | ctrl stays mesh
[BRAIN][NET ] mesh health uplink=24Mbps downlink=28Mbps state=stable
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=172
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=172 encrypt=on
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=173
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=173 encrypt=on
[BRAIN][FORM] reconfiguration trigger | target=LINE-ABREAST spacing=120m
[BRAIN][CTRL] cmd: formation_change(LINE-ABREAST)
[ACK][ACK ] agent_uav_rw_2 accepted | sep=120m rtt=54ms
[ACK][ACK ] agent_uav_rw_4 accepted | sep=120m rtt=42ms
[ACK][ACK ] agent_uav_rw_3 accepted | sep=120m rtt=36ms
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=174
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=174 encrypt=on
[BRAIN][TELM] agent_uav_rw_4 batt=79% alt=152m vel=13m/s
[BRAIN][TELM] agent_uav_rw_3 batt=62% alt=151m vel=13m/s
[BRAIN][NET ] mesh health uplink=44Mbps downlink=27Mbps state=stable
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=175
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=175 encrypt=on
[BRAIN][TELM] agent_uav_rw_4 batt=69% alt=110m vel=9m/s
[BRAIN][TELM] agent_uav_fw_1 batt=69% alt=157m vel=8m/s
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=176
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=176 encrypt=on
[BRAIN][TELM] agent_uav_rw_2 batt=72% alt=126m vel=13m/s
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=177
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=177 encrypt=on
[BRAIN][TELM] agent_uav_rw_3 batt=82% alt=150m vel=7m/s
[BRAIN][TELM] agent_uav_rw_4 batt=62% alt=132m vel=12m/s
[BRAIN][EVNT] ground request from=agent_ground_07 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=22ms
[BRAIN][NET ] mesh health uplink=28Mbps downlink=25Mbps state=degraded
[BRAIN][NET ] policy: rw_2 video mesh->lte | ctrl stays mesh
[BRAIN][FORM] reconfiguration trigger | target=V-ECHELON spacing=80m
[BRAIN][CTRL] cmd: formation_change(V-ECHELON)
[ACK][ACK ] agent_uav_rw_4 accepted | sep=80m rtt=38ms
[ACK][ACK ] agent_uav_fw_1 accepted | sep=80m rtt=29ms
[ACK][ACK ] agent_uav_rw_1 accepted | sep=80m rtt=55ms
[ACK][ACK ] agent_uav_rw_3 accepted | sep=80m rtt=33ms
[BRAIN][NET ] mesh health uplink=40Mbps downlink=40Mbps state=stable
[BRAIN][TELM] agent_uav_rw_4 batt=73% alt=118m vel=7m/s
[BRAIN][TELM] agent_uav_rw_1 batt=90% alt=124m vel=6m/s
[BRAIN][EVNT] ground request from=agent_ground_10 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=19ms
[BRAIN][TELM] agent_uav_rw_3 batt=89% alt=103m vel=12m/s
[BRAIN][TELM] agent_uav_rw_2 batt=80% alt=146m vel=11m/s
[BRAIN][NET ] mesh health uplink=43Mbps downlink=49Mbps state=degraded
[BRAIN][NET ] policy: rw_2 video mesh->lte | ctrl stays mesh
[BRAIN][TELM] agent_uav_rw_2 batt=89% alt=131m vel=10m/s
[BRAIN][EVNT] ground request from=agent_ground_08 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=26ms
[BRAIN][TELM] agent_uav_rw_2 batt=72% alt=128m vel=12m/s
[BRAIN][TELM] agent_uav_rw_4 batt=61% alt=159m vel=14m/s
[BRAIN][EVNT] ground request from=agent_ground_06 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=38ms
[BRAIN][TELM] agent_uav_rw_1 batt=67% alt=141m vel=10m/s
[BRAIN][NET ] mesh health uplink=41Mbps downlink=30Mbps state=degraded
[BRAIN][NET ] policy: rw_2 video mesh->lte | ctrl stays mesh
[BRAIN][TELM] agent_uav_rw_4 batt=71% alt=159m vel=7m/s
[BRAIN][EVNT] ground request from=agent_ground_07 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=39ms
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=178
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=178 encrypt=on
[BRAIN][TELM] agent_uav_rw_4 batt=84% alt=128m vel=9m/s
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=179
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=179 encrypt=on
[BRAIN][FORM] reconfiguration trigger | target=DIAMOND spacing=90m
[BRAIN][CTRL] cmd: formation_change(DIAMOND)
[ACK][ACK ] agent_uav_rw_3 accepted | sep=90m rtt=40ms
[ACK][ACK ] agent_uav_rw_4 accepted | sep=90m rtt=38ms
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=180
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=180 encrypt=on
[BRAIN][NET ] mesh health uplink=34Mbps downlink=32Mbps state=degraded
[BRAIN][NET ] policy: rw_2 video mesh->lte | ctrl stays mesh
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=181
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=181 encrypt=on
[BRAIN][EVNT] ground request from=agent_ground_01 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=45ms
[BRAIN][NET ] mesh health uplink=29Mbps downlink=26Mbps state=stable
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=182
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=182 encrypt=on
[BRAIN][TELM] agent_uav_fw_1 batt=76% alt=143m vel=12m/s
[BRAIN][TELM] agent_uav_rw_4 batt=62% alt=110m vel=13m/s
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=183
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=183 encrypt=on
[BRAIN][TELM] agent_uav_fw_1 batt=73% alt=130m vel=8m/s
[BRAIN][TELM] agent_uav_fw_1 batt=76% alt=149m vel=8m/s
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=184
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=184 encrypt=on
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=185
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=185 encrypt=on
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=186
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=186 encrypt=on
[BRAIN][TELM] agent_uav_rw_4 batt=73% alt=156m vel=12m/s
[BRAIN][TELM] agent_uav_rw_2 batt=76% alt=113m vel=14m/s
[BRAIN][TELM] agent_uav_rw_1 batt=79% alt=134m vel=8m/s
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=187
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=187 encrypt=on
[BRAIN][NET ] mesh health uplink=31Mbps downlink=50Mbps state=degraded
[BRAIN][NET ] policy: rw_2 video mesh->lte | ctrl stays mesh
[BRAIN][TELM] agent_uav_fw_1 batt=64% alt=158m vel=6m/s
[BRAIN][NET ] mesh health uplink=41Mbps downlink=25Mbps state=degraded
[BRAIN][NET ] policy: rw_2 video mesh->lte | ctrl stays mesh
[BRAIN][TELM] agent_uav_rw_3 batt=87% alt=132m vel=10m/s
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=188
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=188 encrypt=on
[BRAIN][TELM] agent_uav_rw_2 batt=88% alt=118m vel=11m/s
[BRAIN][TELM] agent_uav_rw_2 batt=73% alt=128m vel=11m/s
[BRAIN][TELM] agent_uav_rw_4 batt=90% alt=107m vel=12m/s
[BRAIN][TELM] agent_uav_rw_2 batt=66% alt=142m vel=14m/s
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=189
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=189 encrypt=on
[BRAIN][NET ] mesh health uplink=29Mbps downlink=39Mbps state=stable
[BRAIN][TELM] agent_uav_fw_1 batt=74% alt=141m vel=13m/s
[BRAIN][EVNT] ground request from=agent_ground_03 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=36ms
[BRAIN][FORM] reconfiguration trigger | target=V-ECHELON spacing=80m
[BRAIN][CTRL] cmd: formation_change(V-ECHELON)
[ACK][ACK ] agent_uav_rw_1 accepted | sep=80m rtt=22ms
[ACK][ACK ] agent_uav_rw_2 accepted | sep=80m rtt=36ms
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=190
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=190 encrypt=on
[BRAIN][NET ] mesh health uplink=31Mbps downlink=43Mbps state=degraded
[BRAIN][NET ] policy: rw_2 video mesh->lte | ctrl stays mesh
[BRAIN][EVNT] ground request from=agent_ground_05 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=48ms
[BRAIN][TELM] agent_uav_rw_2 batt=86% alt=102m vel=10m/s
[BRAIN][TELM] agent_uav_rw_4 batt=79% alt=113m vel=9m/s
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=191
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=191 encrypt=on
[BRAIN][TELM] agent_uav_rw_1 batt=87% alt=155m vel=7m/s
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=192
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=192 encrypt=on
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=193
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=193 encrypt=on
[BRAIN][NET ] mesh health uplink=37Mbps downlink=36Mbps state=degraded
[BRAIN][NET ] policy: rw_2 video mesh->lte | ctrl stays mesh
[BRAIN][TELM] agent_uav_rw_4 batt=87% alt=105m vel=9m/s
[BRAIN][TELM] agent_uav_fw_1 batt=75% alt=126m vel=13m/s
[BRAIN][EVNT] ground request from=agent_ground_08 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=31ms
[BRAIN][EVNT] ground request from=agent_ground_11 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=37ms
[BRAIN][TELM] agent_uav_rw_3 batt=81% alt=136m vel=8m/s
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=194
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=194 encrypt=on
[BRAIN][TELM] agent_uav_rw_3 batt=67% alt=125m vel=10m/s
[BRAIN][EVNT] ground request from=agent_ground_09 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=37ms
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=195
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=195 encrypt=on
[BRAIN][EVNT] ground request from=agent_ground_02 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=28ms
[BRAIN][TELM] agent_uav_rw_1 batt=60% alt=154m vel=13m/s
[BRAIN][NET ] mesh health uplink=21Mbps downlink=25Mbps state=stable
[BRAIN][FORM] reconfiguration trigger | target=COLUMN spacing=60m
[BRAIN][CTRL] cmd: formation_change(COLUMN)
[ACK][ACK ] agent_uav_rw_4 accepted | sep=60m rtt=43ms
[ACK][ACK ] agent_uav_fw_1 accepted | sep=60m rtt=35ms
[BRAIN][EVNT] ground request from=agent_ground_12 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=50ms
[BRAIN][TELM] agent_uav_rw_1 batt=83% alt=160m vel=8m/s
[BRAIN][TELM] agent_uav_rw_1 batt=64% alt=127m vel=7m/s
[BRAIN][NET ] mesh health uplink=38Mbps downlink=28Mbps state=stable
[BRAIN][TELM] agent_uav_rw_1 batt=71% alt=118m vel=13m/s
[BRAIN][TELM] agent_uav_rw_1 batt=71% alt=135m vel=8m/s
[BRAIN][EVNT] ground request from=agent_ground_09 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=27ms
[BRAIN][EVNT] ground request from=agent_ground_02 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=25ms
[BRAIN][TELM] agent_uav_fw_1 batt=77% alt=142m vel=13m/s
[BRAIN][FORM] reconfiguration trigger | target=V-ECHELON spacing=80m
[BRAIN][CTRL] cmd: formation_change(V-ECHELON)
[ACK][ACK ] agent_uav_fw_1 accepted | sep=80m rtt=19ms
[ACK][ACK ] agent_uav_rw_4 accepted | sep=80m rtt=42ms
[ACK][ACK ] agent_uav_rw_1 accepted | sep=80m rtt=36ms
[BRAIN][TELM] agent_uav_rw_1 batt=81% alt=103m vel=13m/s
[BRAIN][TELM] agent_uav_rw_3 batt=87% alt=137m vel=14m/s
[BRAIN][EVNT] ground request from=agent_ground_03 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=18ms
[BRAIN][NET ] mesh health uplink=31Mbps downlink=25Mbps state=degraded
[BRAIN][NET ] policy: rw_2 video mesh->lte | ctrl stays mesh
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=196
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=196 encrypt=on
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=197
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=197 encrypt=on
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=198
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=198 encrypt=on
[BRAIN][TELM] agent_uav_fw_1 batt=89% alt=116m vel=12m/s
[BRAIN][NET ] mesh health uplink=28Mbps downlink=38Mbps state=degraded
[BRAIN][NET ] policy: rw_2 video mesh->lte | ctrl stays mesh
[BRAIN][TELM] agent_uav_rw_4 batt=77% alt=159m vel=7m/s
[BRAIN][TELM] agent_uav_fw_1 batt=72% alt=138m vel=11m/s
[BRAIN][EVNT] ground request from=agent_ground_02 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=48ms
[BRAIN][TELM] agent_uav_fw_1 batt=87% alt=134m vel=14m/s
[BRAIN][NET ] mesh health uplink=35Mbps downlink=38Mbps state=stable
[BRAIN][TELM] agent_uav_rw_1 batt=78% alt=136m vel=14m/s
[BRAIN][TELM] agent_uav_rw_4 batt=85% alt=151m vel=10m/s
[BRAIN][FORM] reconfiguration trigger | target=COLUMN spacing=60m
[BRAIN][CTRL] cmd: formation_change(COLUMN)
[ACK][ACK ] agent_uav_rw_4 accepted | sep=60m rtt=21ms
[ACK][ACK ] agent_uav_rw_2 accepted | sep=60m rtt=24ms
[ACK][ACK ] agent_uav_rw_3 accepted | sep=60m rtt=31ms
[ACK][ACK ] agent_uav_fw_1 accepted | sep=60m rtt=21ms
[BRAIN][TELM] agent_uav_fw_1 batt=71% alt=130m vel=11m/s
[BRAIN][NET ] mesh health uplink=23Mbps downlink=27Mbps state=stable
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=199
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=199 encrypt=on
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=200
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=200 encrypt=on
[BRAIN][TELM] agent_uav_rw_1 batt=67% alt=154m vel=12m/s
[BRAIN][TELM] agent_uav_rw_4 batt=90% alt=125m vel=10m/s
[BRAIN][EVNT] ground request from=agent_ground_07 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=28ms
[BRAIN][NET ] mesh health uplink=43Mbps downlink=26Mbps state=degraded
[BRAIN][NET ] policy: rw_2 video mesh->lte | ctrl stays mesh
[BRAIN][TELM] agent_uav_rw_1 batt=78% alt=101m vel=7m/s
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=201
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=201 encrypt=on
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=202
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=202 encrypt=on
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=203
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=203 encrypt=on
[BRAIN][EVNT] ground request from=agent_ground_01 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=37ms
[BRAIN][TELM] agent_uav_rw_3 batt=88% alt=145m vel=14m/s
[BRAIN][TELM] agent_uav_rw_4 batt=64% alt=152m vel=9m/s
[BRAIN][TELM] agent_uav_rw_4 batt=67% alt=153m vel=9m/s
[BRAIN][TELM] agent_uav_rw_1 batt=79% alt=147m vel=6m/s
[BRAIN][EVNT] ground request from=agent_ground_05 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=35ms
[BRAIN][TELM] agent_uav_rw_4 batt=89% alt=118m vel=14m/s
[BRAIN][NET ] mesh health uplink=20Mbps downlink=34Mbps state=degraded
[BRAIN][NET ] policy: rw_2 video mesh->lte | ctrl stays mesh
[BRAIN][TELM] agent_uav_rw_4 batt=66% alt=131m vel=7m/s
[BRAIN][TELM] agent_uav_rw_2 batt=83% alt=149m vel=6m/s
[BRAIN][FORM] reconfiguration trigger | target=LINE-ABREAST spacing=120m
[BRAIN][CTRL] cmd: formation_change(LINE-ABREAST)
[ACK][ACK ] agent_uav_rw_4 accepted | sep=120m rtt=39ms
[ACK][ACK ] agent_uav_rw_1 accepted | sep=120m rtt=18ms
[ACK][ACK ] agent_uav_rw_2 accepted | sep=120m rtt=28ms
[ACK][ACK ] agent_uav_fw_1 accepted | sep=120m rtt=55ms
[BRAIN][EVNT] ground request from=agent_ground_02 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=31ms
[BRAIN][EVNT] ground request from=agent_ground_09 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=55ms
[BRAIN][FORM] reconfiguration trigger | target=LINE-ABREAST spacing=120m
[BRAIN][CTRL] cmd: formation_change(LINE-ABREAST)
[ACK][ACK ] agent_uav_rw_1 accepted | sep=120m rtt=38ms
[ACK][ACK ] agent_uav_rw_3 accepted | sep=120m rtt=37ms
[BRAIN][TELM] agent_uav_rw_3 batt=87% alt=143m vel=14m/s
[BRAIN][EVNT] ground request from=agent_ground_11 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=52ms
[BRAIN][NET ] mesh health uplink=35Mbps downlink=41Mbps state=degraded
[BRAIN][NET ] policy: rw_2 video mesh->lte | ctrl stays mesh
[BRAIN][TELM] agent_uav_rw_2 batt=83% alt=108m vel=12m/s
[BRAIN][NET ] mesh health uplink=25Mbps downlink=31Mbps state=degraded
[BRAIN][NET ] policy: rw_2 video mesh->lte | ctrl stays mesh
[BRAIN][TELM] agent_uav_fw_1 batt=89% alt=128m vel=6m/s
[BRAIN][EVNT] ground request from=agent_ground_10 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=31ms
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=204
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=204 encrypt=on
[BRAIN][NET ] mesh health uplink=45Mbps downlink=26Mbps state=degraded
[BRAIN][NET ] policy: rw_2 video mesh->lte | ctrl stays mesh
[BRAIN][TELM] agent_uav_rw_2 batt=83% alt=127m vel=9m/s
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=205
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=205 encrypt=on
[BRAIN][TELM] agent_uav_rw_4 batt=83% alt=119m vel=10m/s
[BRAIN][TELM] agent_uav_rw_3 batt=90% alt=118m vel=10m/s
[BRAIN][TELM] agent_uav_fw_1 batt=89% alt=101m vel=14m/s
[BRAIN][TELM] agent_uav_rw_4 batt=63% alt=110m vel=13m/s
[BRAIN][TELM] agent_uav_rw_3 batt=70% alt=152m vel=10m/s
[BRAIN][NET ] mesh health uplink=42Mbps downlink=45Mbps state=degraded
[BRAIN][NET ] policy: rw_2 video mesh->lte | ctrl stays mesh
[BRAIN][FORM] reconfiguration trigger | target=LINE-ABREAST spacing=120m
[BRAIN][CTRL] cmd: formation_change(LINE-ABREAST)
[ACK][ACK ] agent_uav_fw_1 accepted | sep=120m rtt=46ms
[ACK][ACK ] agent_uav_rw_2 accepted | sep=120m rtt=19ms
[ACK][ACK ] agent_uav_rw_3 accepted | sep=120m rtt=20ms
[ACK][ACK ] agent_uav_rw_4 accepted | sep=120m rtt=39ms
[BRAIN][EVNT] ground request from=agent_ground_03 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=49ms
[BRAIN][FORM] reconfiguration trigger | target=DIAMOND spacing=90m
[BRAIN][CTRL] cmd: formation_change(DIAMOND)
[ACK][ACK ] agent_uav_rw_1 accepted | sep=90m rtt=39ms
[ACK][ACK ] agent_uav_fw_1 accepted | sep=90m rtt=53ms
[ACK][ACK ] agent_uav_rw_2 accepted | sep=90m rtt=55ms
[ACK][ACK ] agent_uav_rw_3 accepted | sep=90m rtt=26ms
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=206
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=206 encrypt=on
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=207
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=207 encrypt=on
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=208
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=208 encrypt=on
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=209
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=209 encrypt=on
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=210
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=210 encrypt=on
[BRAIN][TELM] agent_uav_rw_1 batt=77% alt=134m vel=10m/s
[BRAIN][TELM] agent_uav_rw_3 batt=83% alt=156m vel=6m/s
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=211
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=211 encrypt=on
[BRAIN][TELM] agent_uav_rw_3 batt=81% alt=135m vel=12m/s
[BRAIN][FORM] reconfiguration trigger | target=COLUMN spacing=60m
[BRAIN][CTRL] cmd: formation_change(COLUMN)
[ACK][ACK ] agent_uav_rw_1 accepted | sep=60m rtt=30ms
[ACK][ACK ] agent_uav_rw_2 accepted | sep=60m rtt=28ms
[ACK][ACK ] agent_uav_rw_4 accepted | sep=60m rtt=43ms
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=212
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=212 encrypt=on
[BRAIN][TELM] agent_uav_rw_4 batt=64% alt=131m vel=9m/s
[BRAIN][TELM] agent_uav_rw_4 batt=74% alt=157m vel=6m/s
[BRAIN][EVNT] ground request from=agent_ground_11 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=55ms
[BRAIN][TELM] agent_uav_rw_2 batt=82% alt=125m vel=10m/s
[BRAIN][NET ] mesh health uplink=40Mbps downlink=30Mbps state=degraded
[BRAIN][NET ] policy: rw_2 video mesh->lte | ctrl stays mesh
[BRAIN][TELM] agent_uav_rw_4 batt=78% alt=140m vel=14m/s
[BRAIN][TELM] agent_uav_fw_1 batt=66% alt=138m vel=8m/s
[BRAIN][TELM] agent_uav_rw_1 batt=92% alt=119m vel=14m/s
[BRAIN][TELM] agent_uav_rw_1 batt=81% alt=124m vel=14m/s
[BRAIN][TELM] agent_uav_rw_1 batt=65% alt=132m vel=6m/s
[BRAIN][NET ] mesh health uplink=44Mbps downlink=39Mbps state=stable
[BRAIN][TELM] agent_uav_rw_2 batt=64% alt=121m vel=12m/s
[BRAIN][NET ] mesh health uplink=23Mbps downlink=49Mbps state=degraded
[BRAIN][NET ] policy: rw_2 video mesh->lte | ctrl stays mesh
[BRAIN][TELM] agent_uav_rw_3 batt=67% alt=148m vel=14m/s
[BRAIN][TELM] agent_uav_rw_4 batt=74% alt=134m vel=13m/s
[BRAIN][NET ] mesh health uplink=45Mbps downlink=40Mbps state=degraded
[BRAIN][NET ] policy: rw_2 video mesh->lte | ctrl stays mesh
[BRAIN][TELM] agent_uav_rw_3 batt=83% alt=114m vel=8m/s
[BRAIN][TELM] agent_uav_rw_1 batt=72% alt=136m vel=14m/s
[BRAIN][TELM] agent_uav_rw_1 batt=87% alt=122m vel=13m/s
[BRAIN][FORM] reconfiguration trigger | target=V-ECHELON spacing=80m
[BRAIN][CTRL] cmd: formation_change(V-ECHELON)
[ACK][ACK ] agent_uav_rw_3 accepted | sep=80m rtt=18ms
[ACK][ACK ] agent_uav_rw_2 accepted | sep=80m rtt=24ms
[BRAIN][FORM] reconfiguration trigger | target=V-ECHELON spacing=80m
[BRAIN][CTRL] cmd: formation_change(V-ECHELON)
[ACK][ACK ] agent_uav_rw_1 accepted | sep=80m rtt=21ms
[ACK][ACK ] agent_uav_rw_4 accepted | sep=80m rtt=28ms
[ACK][ACK ] agent_uav_rw_2 accepted | sep=80m rtt=40ms
[ACK][ACK ] agent_uav_rw_3 accepted | sep=80m rtt=41ms
[BRAIN][FORM] reconfiguration trigger | target=LINE-ABREAST spacing=120m
[BRAIN][CTRL] cmd: formation_change(LINE-ABREAST)
[ACK][ACK ] agent_uav_rw_2 accepted | sep=120m rtt=48ms
[ACK][ACK ] agent_uav_rw_4 accepted | sep=120m rtt=31ms
[ACK][ACK ] agent_uav_rw_3 accepted | sep=120m rtt=20ms
[BRAIN][TELM] agent_uav_rw_4 batt=71% alt=127m vel=8m/s
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=213
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=213 encrypt=on
[BRAIN][NET ] mesh health uplink=32Mbps downlink=45Mbps state=degraded
[BRAIN][NET ] policy: rw_2 video mesh->lte | ctrl stays mesh
[BRAIN][TELM] agent_uav_rw_3 batt=75% alt=111m vel=12m/s
[BRAIN][TELM] agent_uav_rw_3 batt=75% alt=105m vel=8m/s
[BRAIN][TELM] agent_uav_rw_1 batt=69% alt=137m vel=8m/s
[BRAIN][TELM] agent_uav_rw_4 batt=86% alt=106m vel=13m/s
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=214
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=214 encrypt=on
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=215
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=215 encrypt=on
[BRAIN][TELM] agent_uav_rw_2 batt=66% alt=140m vel=13m/s
[BRAIN][FORM] reconfiguration trigger | target=V-ECHELON spacing=80m
[BRAIN][CTRL] cmd: formation_change(V-ECHELON)
[ACK][ACK ] agent_uav_fw_1 accepted | sep=80m rtt=37ms
[ACK][ACK ] agent_uav_rw_1 accepted | sep=80m rtt=54ms
[ACK][ACK ] agent_uav_rw_4 accepted | sep=80m rtt=51ms
[BRAIN][NET ] mesh health uplink=20Mbps downlink=31Mbps state=stable
[BRAIN][EVNT] ground request from=agent_ground_07 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=24ms
[BRAIN][NET ] mesh health uplink=28Mbps downlink=50Mbps state=stable
[BRAIN][NET ] mesh health uplink=42Mbps downlink=38Mbps state=stable
[BRAIN][TELM] agent_uav_fw_1 batt=71% alt=152m vel=9m/s
[BRAIN][FORM] reconfiguration trigger | target=V-ECHELON spacing=80m
[BRAIN][CTRL] cmd: formation_change(V-ECHELON)
[ACK][ACK ] agent_uav_rw_4 accepted | sep=80m rtt=35ms
[ACK][ACK ] agent_uav_rw_2 accepted | sep=80m rtt=18ms
[ACK][ACK ] agent_uav_rw_1 accepted | sep=80m rtt=36ms
[ACK][ACK ] agent_uav_rw_3 accepted | sep=80m rtt=27ms
[BRAIN][TELM] agent_uav_rw_1 batt=61% alt=137m vel=8m/s
[BRAIN][TELM] agent_uav_rw_4 batt=75% alt=108m vel=6m/s
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=216
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=216 encrypt=on
[BRAIN][FORM] reconfiguration trigger | target=COLUMN spacing=60m
[BRAIN][CTRL] cmd: formation_change(COLUMN)
[ACK][ACK ] agent_uav_fw_1 accepted | sep=60m rtt=26ms
[ACK][ACK ] agent_uav_rw_2 accepted | sep=60m rtt=53ms
[ACK][ACK ] agent_uav_rw_3 accepted | sep=60m rtt=32ms
[ACK][ACK ] agent_uav_rw_1 accepted | sep=60m rtt=33ms
[BRAIN][EVNT] ground request from=agent_ground_04 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=53ms
[BRAIN][EVNT] ground request from=agent_ground_01 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=21ms
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=217
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=217 encrypt=on
[BRAIN][NET ] mesh health uplink=34Mbps downlink=25Mbps state=degraded
[BRAIN][NET ] policy: rw_2 video mesh->lte | ctrl stays mesh
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=218
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=218 encrypt=on
[BRAIN][TELM] agent_uav_rw_1 batt=82% alt=152m vel=9m/s
[BRAIN][TELM] agent_uav_rw_1 batt=74% alt=105m vel=9m/s
[BRAIN][EVNT] ground request from=agent_ground_01 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=43ms
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=219
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=219 encrypt=on
[BRAIN][TELM] agent_uav_rw_4 batt=61% alt=108m vel=13m/s
[BRAIN][TELM] agent_uav_rw_1 batt=75% alt=124m vel=14m/s
[BRAIN][NET ] mesh health uplink=29Mbps downlink=43Mbps state=stable
[BRAIN][TELM] agent_uav_rw_1 batt=74% alt=125m vel=7m/s
[BRAIN][FORM] reconfiguration trigger | target=V-ECHELON spacing=80m
[BRAIN][CTRL] cmd: formation_change(V-ECHELON)
[ACK][ACK ] agent_uav_rw_2 accepted | sep=80m rtt=22ms
[ACK][ACK ] agent_uav_rw_1 accepted | sep=80m rtt=44ms
[ACK][ACK ] agent_uav_rw_3 accepted | sep=80m rtt=41ms
[BRAIN][EVNT] ground request from=agent_ground_09 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=52ms
[BRAIN][TELM] agent_uav_rw_1 batt=83% alt=123m vel=11m/s
[BRAIN][TELM] agent_uav_fw_1 batt=60% alt=142m vel=10m/s
[BRAIN][NET ] mesh health uplink=27Mbps downlink=48Mbps state=degraded
[BRAIN][NET ] policy: rw_2 video mesh->lte | ctrl stays mesh
[BRAIN][TELM] agent_uav_rw_2 batt=82% alt=155m vel=7m/s
[BRAIN][NET ] mesh health uplink=25Mbps downlink=37Mbps state=stable
[BRAIN][TELM] agent_uav_rw_4 batt=68% alt=105m vel=8m/s
[BRAIN][FORM] reconfiguration trigger | target=LINE-ABREAST spacing=120m
[BRAIN][CTRL] cmd: formation_change(LINE-ABREAST)
[ACK][ACK ] agent_uav_rw_2 accepted | sep=120m rtt=47ms
[ACK][ACK ] agent_uav_fw_1 accepted | sep=120m rtt=23ms
[ACK][ACK ] agent_uav_rw_4 accepted | sep=120m rtt=54ms
[ACK][ACK ] agent_uav_rw_3 accepted | sep=120m rtt=43ms
[BRAIN][TELM] agent_uav_rw_4 batt=81% alt=134m vel=12m/s
[BRAIN][TELM] agent_uav_fw_1 batt=89% alt=147m vel=10m/s
[BRAIN][TELM] agent_uav_fw_1 batt=73% alt=138m vel=11m/s
[BRAIN][TELM] agent_uav_rw_4 batt=92% alt=120m vel=14m/s
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=220
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=220 encrypt=on
[BRAIN][TELM] agent_uav_rw_2 batt=85% alt=120m vel=12m/s
[BRAIN][FORM] reconfiguration trigger | target=COLUMN spacing=60m
[BRAIN][CTRL] cmd: formation_change(COLUMN)
[ACK][ACK ] agent_uav_fw_1 accepted | sep=60m rtt=32ms
[ACK][ACK ] agent_uav_rw_1 accepted | sep=60m rtt=25ms
[ACK][ACK ] agent_uav_rw_2 accepted | sep=60m rtt=19ms
[ACK][ACK ] agent_uav_rw_4 accepted | sep=60m rtt=51ms
[BRAIN][NET ] mesh health uplink=40Mbps downlink=28Mbps state=degraded
[BRAIN][NET ] policy: rw_2 video mesh->lte | ctrl stays mesh
[BRAIN][TELM] agent_uav_fw_1 batt=88% alt=129m vel=12m/s
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=221
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=221 encrypt=on
[BRAIN][NET ] mesh health uplink=40Mbps downlink=48Mbps state=stable
[BRAIN][FORM] reconfiguration trigger | target=LINE-ABREAST spacing=120m
[BRAIN][CTRL] cmd: formation_change(LINE-ABREAST)
[ACK][ACK ] agent_uav_fw_1 accepted | sep=120m rtt=52ms
[ACK][ACK ] agent_uav_rw_2 accepted | sep=120m rtt=27ms
[ACK][ACK ] agent_uav_rw_3 accepted | sep=120m rtt=18ms
[ACK][ACK ] agent_uav_rw_1 accepted | sep=120m rtt=52ms
[BRAIN][TELM] agent_uav_rw_2 batt=67% alt=109m vel=7m/s
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=222
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=222 encrypt=on
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=223
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=223 encrypt=on
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=224
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=224 encrypt=on
[BRAIN][EVNT] ground request from=agent_ground_10 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=31ms
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=225
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=225 encrypt=on
[BRAIN][TELM] agent_uav_fw_1 batt=90% alt=120m vel=8m/s
[BRAIN][TELM] agent_uav_rw_3 batt=89% alt=160m vel=10m/s
[BRAIN][EVNT] ground request from=agent_ground_01 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=46ms
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=226
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=226 encrypt=on
[BRAIN][TELM] agent_uav_rw_4 batt=66% alt=136m vel=7m/s
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=227
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=227 encrypt=on
[BRAIN][TELM] agent_uav_rw_2 batt=74% alt=122m vel=12m/s
[BRAIN][TELM] agent_uav_fw_1 batt=65% alt=158m vel=14m/s
[BRAIN][NET ] mesh health uplink=32Mbps downlink=38Mbps state=stable
[BRAIN][TELM] agent_uav_rw_1 batt=80% alt=126m vel=7m/s
[BRAIN][TELM] agent_uav_rw_3 batt=82% alt=118m vel=12m/s
[BRAIN][TELM] agent_uav_rw_1 batt=87% alt=146m vel=11m/s
[BRAIN][EVNT] ground request from=agent_ground_03 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=31ms
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=228
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=228 encrypt=on
[BRAIN][FORM] reconfiguration trigger | target=V-ECHELON spacing=80m
[BRAIN][CTRL] cmd: formation_change(V-ECHELON)
[ACK][ACK ] agent_uav_rw_4 accepted | sep=80m rtt=19ms
[ACK][ACK ] agent_uav_rw_2 accepted | sep=80m rtt=42ms
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=229
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=229 encrypt=on
[BRAIN][FORM] reconfiguration trigger | target=LINE-ABREAST spacing=120m
[BRAIN][CTRL] cmd: formation_change(LINE-ABREAST)
[ACK][ACK ] agent_uav_rw_1 accepted | sep=120m rtt=53ms
[ACK][ACK ] agent_uav_rw_2 accepted | sep=120m rtt=28ms
[ACK][ACK ] agent_uav_fw_1 accepted | sep=120m rtt=50ms
[ACK][ACK ] agent_uav_rw_4 accepted | sep=120m rtt=30ms
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=230
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=230 encrypt=on
[BRAIN][TELM] agent_uav_rw_4 batt=82% alt=109m vel=8m/s
[BRAIN][FORM] reconfiguration trigger | target=V-ECHELON spacing=80m
[BRAIN][CTRL] cmd: formation_change(V-ECHELON)
[ACK][ACK ] agent_uav_fw_1 accepted | sep=80m rtt=50ms
[ACK][ACK ] agent_uav_rw_2 accepted | sep=80m rtt=46ms
[ACK][ACK ] agent_uav_rw_3 accepted | sep=80m rtt=21ms
[BRAIN][TELM] agent_uav_rw_4 batt=84% alt=121m vel=14m/s
[BRAIN][TELM] agent_uav_rw_4 batt=79% alt=127m vel=12m/s
[BRAIN][FORM] reconfiguration trigger | target=COLUMN spacing=60m
[BRAIN][CTRL] cmd: formation_change(COLUMN)
[ACK][ACK ] agent_uav_rw_2 accepted | sep=60m rtt=25ms
[ACK][ACK ] agent_uav_fw_1 accepted | sep=60m rtt=29ms
[ACK][ACK ] agent_uav_rw_1 accepted | sep=60m rtt=52ms
[ACK][ACK ] agent_uav_rw_3 accepted | sep=60m rtt=32ms
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=231
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=231 encrypt=on
[BRAIN][TELM] agent_uav_fw_1 batt=77% alt=115m vel=14m/s
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=232
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=232 encrypt=on
[BRAIN][FORM] reconfiguration trigger | target=LINE-ABREAST spacing=120m
[BRAIN][CTRL] cmd: formation_change(LINE-ABREAST)
[ACK][ACK ] agent_uav_fw_1 accepted | sep=120m rtt=44ms
[ACK][ACK ] agent_uav_rw_3 accepted | sep=120m rtt=21ms
[ACK][ACK ] agent_uav_rw_1 accepted | sep=120m rtt=33ms
[ACK][ACK ] agent_uav_rw_4 accepted | sep=120m rtt=20ms
[BRAIN][FORM] reconfiguration trigger | target=DIAMOND spacing=90m
[BRAIN][CTRL] cmd: formation_change(DIAMOND)
[ACK][ACK ] agent_uav_rw_2 accepted | sep=90m rtt=25ms
[ACK][ACK ] agent_uav_fw_1 accepted | sep=90m rtt=40ms
[ACK][ACK ] agent_uav_rw_3 accepted | sep=90m rtt=23ms
[BRAIN][TELM] agent_uav_fw_1 batt=68% alt=130m vel=14m/s
[BRAIN][TELM] agent_uav_rw_2 batt=82% alt=129m vel=10m/s
[BRAIN][TELM] agent_uav_rw_2 batt=65% alt=105m vel=12m/s
[BRAIN][NET ] mesh health uplink=44Mbps downlink=39Mbps state=stable
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=233
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=233 encrypt=on
[BRAIN][EVNT] ground request from=agent_ground_02 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=43ms
[BRAIN][EVNT] ground request from=agent_ground_03 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=24ms
[BRAIN][TELM] agent_uav_rw_2 batt=78% alt=131m vel=10m/s
[BRAIN][FORM] reconfiguration trigger | target=DIAMOND spacing=90m
[BRAIN][CTRL] cmd: formation_change(DIAMOND)
[ACK][ACK ] agent_uav_rw_4 accepted | sep=90m rtt=35ms
[ACK][ACK ] agent_uav_rw_2 accepted | sep=90m rtt=37ms
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=234
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=234 encrypt=on
[BRAIN][TELM] agent_uav_fw_1 batt=87% alt=160m vel=14m/s
[BRAIN][TELM] agent_uav_rw_3 batt=74% alt=144m vel=11m/s
[BRAIN][TELM] agent_uav_rw_3 batt=71% alt=158m vel=12m/s
[BRAIN][TELM] agent_uav_rw_2 batt=79% alt=159m vel=9m/s
[BRAIN][EVNT] ground request from=agent_ground_02 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=51ms
[BRAIN][TELM] agent_uav_rw_2 batt=79% alt=123m vel=9m/s
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=235
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=235 encrypt=on
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=236
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=236 encrypt=on
[BRAIN][NET ] mesh health uplink=33Mbps downlink=43Mbps state=degraded
[BRAIN][NET ] policy: rw_2 video mesh->lte | ctrl stays mesh
[BRAIN][TELM] agent_uav_rw_2 batt=83% alt=152m vel=8m/s
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=237
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=237 encrypt=on
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=238
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=238 encrypt=on
[BRAIN][TELM] agent_uav_fw_1 batt=74% alt=100m vel=6m/s
[BRAIN][NET ] mesh health uplink=21Mbps downlink=40Mbps state=stable
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=239
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=239 encrypt=on
[BRAIN][TELM] agent_uav_fw_1 batt=66% alt=119m vel=9m/s
[BRAIN][TELM] agent_uav_rw_1 batt=85% alt=105m vel=10m/s
[BRAIN][TELM] agent_uav_rw_2 batt=84% alt=132m vel=7m/s
[BRAIN][EVNT] ground request from=agent_ground_08 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=36ms
[BRAIN][EVNT] ground request from=agent_ground_10 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=38ms
[BRAIN][TELM] agent_uav_rw_3 batt=73% alt=130m vel=11m/s
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=240
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=240 encrypt=on
[BRAIN][EVNT] ground request from=agent_ground_12 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=35ms
[BRAIN][TELM] agent_uav_rw_4 batt=76% alt=105m vel=12m/s
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=241
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=241 encrypt=on
[BRAIN][NET ] mesh health uplink=30Mbps downlink=34Mbps state=stable
[BRAIN][TELM] agent_uav_rw_3 batt=85% alt=158m vel=7m/s
[BRAIN][TELM] agent_uav_rw_1 batt=81% alt=157m vel=10m/s
[BRAIN][TELM] agent_uav_rw_4 batt=82% alt=159m vel=14m/s
[BRAIN][FORM] reconfiguration trigger | target=LINE-ABREAST spacing=120m
[BRAIN][CTRL] cmd: formation_change(LINE-ABREAST)
[ACK][ACK ] agent_uav_rw_2 accepted | sep=120m rtt=28ms
[ACK][ACK ] agent_uav_rw_4 accepted | sep=120m rtt=52ms
[ACK][ACK ] agent_uav_rw_1 accepted | sep=120m rtt=18ms
[ACK][ACK ] agent_uav_fw_1 accepted | sep=120m rtt=36ms
[BRAIN][EVNT] ground request from=agent_ground_05 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=47ms
[BRAIN][FORM] reconfiguration trigger | target=COLUMN spacing=60m
[BRAIN][CTRL] cmd: formation_change(COLUMN)
[ACK][ACK ] agent_uav_rw_1 accepted | sep=60m rtt=24ms
[ACK][ACK ] agent_uav_rw_3 accepted | sep=60m rtt=38ms
[BRAIN][NET ] mesh health uplink=39Mbps downlink=26Mbps state=degraded
[BRAIN][NET ] policy: rw_2 video mesh->lte | ctrl stays mesh
[BRAIN][TELM] agent_uav_rw_4 batt=63% alt=146m vel=8m/s
[BRAIN][TELM] agent_uav_fw_1 batt=63% alt=156m vel=10m/s
[BRAIN][NET ] mesh health uplink=42Mbps downlink=39Mbps state=degraded
[BRAIN][NET ] policy: rw_2 video mesh->lte | ctrl stays mesh
[BRAIN][TELM] agent_uav_rw_4 batt=84% alt=127m vel=14m/s
[BRAIN][TELM] agent_uav_rw_2 batt=60% alt=109m vel=7m/s
[BRAIN][EVNT] ground request from=agent_ground_12 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=48ms
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=242
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=242 encrypt=on
[BRAIN][TELM] agent_uav_fw_1 batt=81% alt=104m vel=13m/s
[BRAIN][FORM] reconfiguration trigger | target=V-ECHELON spacing=80m
[BRAIN][CTRL] cmd: formation_change(V-ECHELON)
[ACK][ACK ] agent_uav_rw_2 accepted | sep=80m rtt=27ms
[ACK][ACK ] agent_uav_rw_1 accepted | sep=80m rtt=46ms
[ACK][ACK ] agent_uav_rw_3 accepted | sep=80m rtt=45ms
[BRAIN][SIT ] COP update tracks=12 hazards=0 seq=243
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=243 encrypt=on
[BRAIN][TELM] agent_uav_rw_3 batt=87% alt=153m vel=7m/s
[BRAIN][SIT ] COP update tracks=12 hazards=1 seq=244
[BRAIN][PUB ] -> HANDSET_* cop_delta seq=244 encrypt=on
[BRAIN][TELM] agent_uav_rw_4 batt=75% alt=138m vel=12m/s
[BRAIN][EVNT] ground request from=agent_ground_05 type=RESOURCE_SUPPORT
[BRAIN][DCID] allocate rw_3 cargo -> supply_point_1
[ACK][ACK ] agent_uav_rw_3 divert accepted rtt=41ms
[BRAIN][TELM] agent_uav_fw_1 batt=70% alt=101m vel=6m/s
[BRAIN][TELM] agent_uav_rw_2 batt=91% alt=119m vel=11m/s
[BRAIN][FORM] reconfiguration trigger | target=V-ECHELON spacing=80m
[BRAIN][CTRL] cmd: formation_change(V-ECHELON)
[ACK][ACK ] agent_uav_rw_1 accepted | sep=80m rtt=34ms
[ACK][ACK ] agent_uav_rw_4 accepted | sep=80m rtt=39ms
[BRAIN][END ] simulation end requested | phase complete
[BRAIN][END ] closing control/data/video channels
`,
  LINE_HEIGHT: 28, // 行高(px)，与CSS严格一致
  PADDING: 20, // 容器内边距(px)，与CSS一致
}

// ************************* 响应式数据 *************************
const containerRef = ref(null) // 主容器
const contentRef = ref(null) // 内容容器
const currentText = ref('') // 当前打字行（含时间前缀）
const allLines = ref([]) // 所有已完成的行（含时间前缀）
const renderLines = ref([]) // 实际渲染的行（裁剪后）
const isCollapsed = ref(false) // 控制收起/展开
let typingIndex = 0 // 全局打字行索引（核心修复：替代charIndex，精准控制行切换）
let typingTimer = null // 打字定时器
let charPosition = 0 // 单行内的字符位置（逐字打字用）
let containerAvailableHeight = 0 // 容器可用高度(容器高-内边距-1行高)
let rawTextLines = [] // 预处理后的原始文本行（永久保存，不随裁剪改变）

// ************************* 工具函数：格式化当前时间（每行前缀） *************************
const formatCurrentTime = () => {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} `
}

// ************************* 初始化：计算可用高度，预留底部行空间 *************************
const init = async () => {
  await nextTick()
  if (!containerRef.value) return
  const containerRealHeight = containerRef.value.getBoundingClientRect().height
  containerAvailableHeight = containerRealHeight - CONFIG.PADDING * 2 - CONFIG.LINE_HEIGHT
  rawTextLines = CONFIG.TEXT_CONTENT.split(/\r?\n/).filter((line) => line.trim() !== '')
  currentText.value = formatCurrentTime()
  typingIndex = 0
  charPosition = 0
}

// ************************* 核心：检查高度并裁剪（满屏上移，不影响原始文本） *************************
const checkAndCrop = () => {
  const doneLinesHeight = allLines.value.length * CONFIG.LINE_HEIGHT
  if (doneLinesHeight > containerAvailableHeight && allLines.value.length > 0) {
    allLines.value.shift()
    renderLines.value = [...allLines.value]
  }
}

// 重置状态：清空行，重新生成时间前缀，保证下一轮从空白开始
const resetTypingState = () => {
  allLines.value = []
  renderLines.value = []
  typingIndex = 0
  charPosition = 0
  currentText.value = formatCurrentTime()
}

// 拆分时间前缀与正文，便于分别着色
const splitLine = (line) => {
  const prefix = line.slice(0, 20)
  const content = line.slice(20)
  return { prefix, content }
}

const toggleOverlay = () => {
  isCollapsed.value = !isCollapsed.value
  // 收起时立即停止渲染内容，展开时重新计算高度与裁剪
  if (isCollapsed.value) {
    stopTyping()
  } else {
    nextTick(() => {
      init()
      startTyping()
    })
  }
}

// ************************* 核心：左到右逐字打字（修复行索引，不重复） *************************
const typeChar = () => {
  if (rawTextLines.length === 0) return
  const currentRawLine = rawTextLines[typingIndex]

  if (charPosition < currentRawLine.length) {
    currentText.value += currentRawLine[charPosition]
    charPosition++
  } else {
    allLines.value.push(currentText.value)
    renderLines.value = [...allLines.value]
    checkAndCrop()
    charPosition = 0
    typingIndex++

    if (typingIndex < rawTextLines.length) {
      currentText.value = formatCurrentTime()
    } else {
      if (typingTimer) clearInterval(typingTimer)
      typingTimer = null
      resetTypingState()
      setTimeout(() => {
        startTyping()
      }, 3000)
    }
  }
}

// ************************* 启动/停止打字 *************************
const startTyping = () => {
  if (typingTimer) clearInterval(typingTimer)
  typingTimer = setInterval(typeChar, CONFIG.TYPE_SPEED)
}

const stopTyping = () => {
  if (typingTimer) clearInterval(typingTimer)
}

// ************************* 组件生命周期 *************************
onMounted(async () => {
  await init()
  startTyping()
})

onUnmounted(() => {
  stopTyping()
})
</script>

<style scoped>
.typewriter-container {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100vw;
  height: 50vh;
  background: rgba(0, 0, 0, 0.85);
  z-index: 9999;
  overflow: hidden !important;
  padding: 20px 30px;
  box-sizing: border-box;
  font-family: 'Consolas', 'Microsoft YaHei', monospace;
  font-size: 16px;
  transition: transform 0.3s ease;
}

.typewriter-container.collapsed {
  transform: translateY(calc(50vh - 44px));
}

.typewriter-content {
  width: 100%;
  box-sizing: border-box;
  margin: 0 !important;
  padding: 0 !important;
}

.type-line {
  width: 100%;
  height: 28px !important;
  line-height: 28px !important;
  margin: 0 !important;
  text-align: left;
  padding: 0 !important;
  color: #00ff00;
  white-space: pre-wrap;
  word-break: break-all;
  box-sizing: border-box;
  min-height: 28px !important;
  max-height: 28px !important;
}

.time {
  color: #ffffff;
}

.content {
  color: inherit;
}

.type-current {
  position: relative;
  z-index: 10;
}

.cursor {
  display: inline-block;
  width: 8px;
  height: 28px;
  line-height: 28px;
  vertical-align: top;
  animation: blink 1s step-end infinite;
  font-weight: bold;
  color: #00ff00;
  margin-left: 2px;
}

@keyframes blink {
  0%,
  49% {
    opacity: 1;
  }
  50%,
  100% {
    opacity: 0;
  }
}

*::-webkit-scrollbar {
  display: none !important;
}

* {
  scrollbar-width: none !important;
  -ms-overflow-style: none !important;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.toggle-btn {
  position: absolute;
  top: 8px;
  right: 12px;
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid #4b5563;
  background: rgba(30, 41, 59, 0.95);
  color: #e5e7eb;
  cursor: pointer;
  font-size: 12px;
  z-index: 2;
}

.toggle-btn:hover {
  border-color: #60a5fa;
  color: #fff;
}
</style>
