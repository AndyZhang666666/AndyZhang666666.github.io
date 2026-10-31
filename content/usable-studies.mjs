const L=(zh,en)=>({zh,en});
export const usableStudies=[{
 id:'commute',project:'commute',related:[],
 name:L('把通勤比较变成个人选择','From a comparison to a personal choice'),
 title:L('多花的钱，换回怎样的早晨？','What kind of morning does the extra fare buy?'),
 summary:L('输入自己的路线与费用，比较每月花费、节省时间和波动。用个人记录校准一条路线，再保存选择与理由。','Enter routes and fares, compare monthly cost, time and variation, then calibrate one route and save your choice.'),
 image:'showcase/commute.jpg',secondaryImage:'showcase/commute-crop.jpg',
 alt:L('通勤比较器实际界面，月度代价、路线选择与个人决策卡','Actual Commute Compare screen with monthly tradeoffs, routes and a decision card'),
 caption:L('通勤比较器 · 输入、校准、选择与独立快照','Commute Compare · Inputs, calibration, choice and snapshot'),
 status:L('浏览器内模拟；估算与个人记录分别标识','Browser simulation; estimates and personal records labelled separately'),
 question:L('比较完时间和钱，用户接下来怎么选？','What happens after comparing time and money?'),
 problem:L('图表能列出哪个更快，却不知道一个人愿意为舒适、少换乘或早回家付多少。只给结论不保留输入，条件变了还容易沿用旧决定。','A chart cannot decide how much someone values comfort, fewer transfers or an earlier return. Without preserved inputs, an old decision may outlive its conditions.'),
 role:L('独立设计并实现快速估算、记录校准、成本与时间比较、出门时刻、理由和决策卡；复用既有稳定路线种子的模拟算法。','Independently designed estimates, record calibration, time/cost comparisons, departure times and decision snapshots using the existing stable-route-seed model.'),
 insight:L('计算给出代价，选择保留给人；输入改变，决定就要重新确认。','Calculate the tradeoff, leave the choice to the person, and reconfirm it when inputs change.'),
 choices:[
  [L('只推荐最快的路线','Recommend the fastest'),L('忽略费用、尾部波动和个人偏好。','Ignores cost, variation and personal priorities.')],
  [L('要求填完所有分布参数','Ask for every parameter'),L('看似精确，首次使用负担重，估计也未必更准。','Adds effort without ensuring more accurate estimates.')],
  [L('先估算，再校准与选择','Estimate, calibrate, then choose'),L('采用的做法：常见耗时和费用先行，个人记录按路线补充，最终选择明确确认。','Implemented: start with common time and fare, add route-specific records, then explicitly confirm a choice.')],
 ],
 decisions:[
  {title:L('先把时间换成同一单位','Use a comparable unit'),text:L('首位展示每月多花、节省小时和每省一小时的费用。零时间优势不显示无穷大的比值，更慢的路线单独说明。','Lead with monthly cost, hours saved and cost per hour saved. Equal time has no infinite ratio; slower routes are described separately.')},
  {title:L('只校准这一条路线','Calibrate one route'),text:L('从结果直达对应路线的记录输入，应用记录不会改动另一条路线。估算、个人记录与模型内范围各自标识。','Open the selected route’s records without changing the other route. Distinguish estimates, personal observations and modelled ranges.')},
  {title:L('决定是快照，不随参数漂移','A choice is a snapshot'),text:L('保存参数、模型版本、比较结果和理由。修改输入时保留旧选择，并要求重新确认；重算或无效输入期间锁定当前导出。','Save inputs, model version, results and reason. Input edits preserve the previous choice but require reconfirmation; pending or invalid states block current exports.')},
 ],
 tradeoff:L('快速估算降低了输入负担，也引入了三点分布假设。实际记录仍可能不包含雨天或异常，不能把模型内尾部风险当成未来准点承诺。','Quick entry lowers effort but introduces distribution assumptions. Personal records may miss disruptions, so modelled risk is not a punctuality guarantee.'),
 proof:L('浏览器实际检查了自定义路线、单条记录校准、选择保存、参数改变后重新确认与 JSON 导出。计算与状态检查不等于真实出行验证；未接地图或实时交通。','Browser checks cover custom inputs, single-route calibration, saved choices, reconfirmation and JSON export. These do not establish real-world travel accuracy; no map or live-traffic service is connected.'),
 next:L('邀请使用者连续记录相近出发时段的工作日耗时，观察估算与个人记录下的选择是否变化，并补问舒适度、换乘与异常天气。','Collect comparable weekday records, observe whether calibrated inputs change the choice, and ask about comfort, transfers and weather.'),
 artifact:L('包含路线输入、数据来源、比较结果、选择理由和模型版本的个人决策卡。','A personal decision card containing inputs, sources, comparisons, rationale and model version.'),
}];
