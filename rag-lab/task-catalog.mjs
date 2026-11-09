// Task cases extend the public exercise without changing the frozen 12-document corpus.
import {retrieveRun,validDate,search,excludedEvidence,inspectCitations} from './engine.mjs';
const extra=(id,policy,title,text,from='2026-07-01',to=null)=>({id,policy,title,version:'task-1.0',effectiveFrom:from,effectiveTo:to,roles:['employee','admin'],snapshots:['baseline','revised'],chunks:[{id:`${id}:p1`,heading:title,text}]});
export const TASK_DOCUMENTS=[
 extra('TASK-REN','task-renew','续借办理补充（虚构）','续借申请需在到期前提交；已有预约时不可续借。申请仍需设备负责人确认。'),
 extra('TASK-TRANS','task-transition','过渡规则说明（虚构）','2026年7月1日前借出的显示器，原借用期间按领取时规则；续借作为新申请，按申请时适用制度处理。'),
 extra('TASK-RET','equipment-return','归还办理点变更（虚构）','设备归还地点为青屿工作室二楼设备台。自2026年11月1日起，一楼办理点迁至二楼；携带电源与配件核对并登记。','2026-11-01'),
 extra('TASK-DAMAGE','task-damage','损坏处理流程（虚构）','设备损坏应停止使用、拍照并联系设备负责人。本资料没有赔偿金额和计价办法。'),
 extra('TASK-PUR','task-purchase','员工采购申请说明（虚构）','员工可准备设备用途、规格和预算说明；审批不因提交申请而自动通过。内部审批额度不在公开资料中。'),
 extra('TASK-CONFLICT-A','task-location-conflict','临时办理点通知A（虚构）','临时设备办理点为一楼；与通知B同日生效，未记录替代关系。'),
 extra('TASK-CONFLICT-B','task-location-conflict','临时办理点通知B（虚构）','临时设备办理点为二楼；与通知A同日生效，未记录优先级。'),
 extra('TASK-RECORD','task-record','借用登记清单（虚构）','登记设备、领取日期、申请人和拟归还日期。资料不足时补齐，不按文件修改时间推定领取日期。'),
 extra('TASK-BOOKING','task-booking','预约查询说明（虚构）','续借前向设备负责人确认是否已有预约；未知预约状态不等于没有预约。'),
 extra('TASK-MISSING','task-missing','未覆盖事项说明（虚构）','扫码订位、付款和企业审批系统均不在本示例范围。此资料不能授权任何实际操作。'),
 extra('TASK-HELP','task-help','设备办理联络（虚构）','资料冲突或未覆盖事项请设备负责人补充确认。保留本次问题和实际引用，方便继续沟通。'),
 extra('TASK-RECEIPT','task-receipt','确认与提交的区别（虚构）','申请草稿、已提交申请和已批准是不同状态。本站只形成答复草稿，不代替实际提交或审批。'),
];
export const TASKS=[
 {id:'R01',title:'现在借显示器',question:'显示器最长能借多久？',goal:'核对当前适用借期并带走答复',date:'2026-10-28'},
 {id:'R02',title:'回查历史借用',question:'显示器最长能借多久？',goal:'历史日期应使用当时有效版本',date:'2026-06-30'},
 {id:'R03',title:'制度修订以后',question:'显示器最长能借多久？',goal:'新快照不是旧运行的依据',snapshot:'revised'},
 {id:'R04',title:'续借前还缺什么',question:'显示器可以续借几次？',goal:'补齐领取日期、已续借次数和预约状态',facts:true},
 {id:'R05',title:'跨版本的续借',question:'显示器可以续借几次？',goal:'把原借用与新申请的规则分开',facts:true,transition:true},
 {id:'R06',title:'条件满足也要确认',question:'显示器可以续借几次？',goal:'可提出申请，不代表已经获批',facts:true,used:'0',booking:'no'},
 {id:'R07',title:'本次无法再续借',question:'显示器可以续借几次？',goal:'说明是次数或预约条件未满足',facts:true,used:'1',booking:'no'},
 {id:'R08',title:'把设备还到哪里',question:'设备归还地点在哪里？',goal:'归还地点、配件和登记一起说明'},
 {id:'R09',title:'损坏后如何处理',question:'显示器损坏要赔偿多少钱？',goal:'流程有依据，金额仍需补充',damage:true},
 {id:'R10',title:'公开资料范围以外',question:'应急备用机有多少台？',goal:'当前缺依据，不推测管理资料内容',admin:true},
 {id:'R11',title:'遇到两份冲突规定',question:'无人机最长能借多久？',goal:'并列冲突，待负责人确认'},
 {id:'R12',title:'资料没有这种设备',question:'平板电脑最长能借多久？',goal:'不能套用相近设备的规则',missing:true},
];
export function taskRun(documents,task,input,facts={},options={}){
 const docs=[...documents,...TASK_DOCUMENTS];
 const run=retrieveRun(docs,input,options.role??(task.admin?'admin':'employee'),options.mode??'original-example');
 run.versions={...run.versions,tasks:'equipment-tasks-v1'};
 run.taskId=task.id;run.taskFacts={...facts};run.taskNext=[];
 // Supplemental clauses are actually searched within the same server-authorized scope.
 const scope={role:run.role,date:run.date,snapshot:run.snapshot};
 const supplemental=search(docs,`${input.question} 续借 到期 预约 过渡 归还 配件 损坏 负责人`,scope,100);
 const attach=id=>{const c=supplemental.find(c=>c.docId===id);if(!c)return false;
  if(!run.retrieved.some(r=>r.id===c.id))run.retrieved.push({...c,retrievalReason:'任务条件补充检索'});
  if(!run.citations.some(r=>r.id===c.id))run.citations.push({...c,quote:c.text});return true;};

 if(task.facts){
  const hasProcedure=attach('TASK-REN')&&attach('TASK-BOOKING');
  const gaps=[];if(!facts.borrowed)gaps.push('领取日期');if(facts.used===''||facts.used===undefined)gaps.push('已续借次数');if(!facts.due)gaps.push('实际到期日期');if(!facts.booking||facts.booking==='unknown')gaps.push('是否已有预约');
  if(gaps.length){run.status='clarify';run.answer=`还需要确认：${gaps.join('、')}。已找到续借规定，但缺少事实不能直接判断。`;}
  else if(!['yes','no','unknown'].includes(facts.booking)||!/^\d+$/.test(facts.used)||!validDate(facts.borrowed)||!validDate(facts.due)||facts.borrowed>input.date||facts.due<=facts.borrowed){run.status='clarify';run.answer='请核对领取日期和已续借次数；领取日期不能晚于本次申请日期。';}
  else if(!hasProcedure||!run.facts.some(f=>f.facet==='renew')){run.status='insufficient';run.answer='本次日期与资料快照没有完整的续借次数和办理前提依据，不能套用其他时期规则。';}
  else if(input.date>=facts.due){run.status='insufficient';run.answer='本次申请日期已不在实际到期日前，不能按到期前续借规则形成可申请结论。';}
  else if(Number(facts.used)>=Number.parseInt(run.facts.find(f=>f.facet==='renew')?.value||'0')||facts.booking==='yes'){run.status='insufficient';run.answer=Number(facts.used)>=Number.parseInt(run.facts.find(f=>f.facet==='renew')?.value||'0')?'当前已用完资料允许的续借次数，不能按示例规则再次续借。':'当前已有预约，不满足示例续借前提。';run.taskNext.push('核对事实，或归还设备并向设备负责人询问其他安排。');}
  else {run.status='answered';run.answer='在本示例资料及你提供的事实下，可以提出续借申请；仍需到期前提交并由设备负责人确认。不是已经批准。';}
  if(task.transition){if(!attach('TASK-TRANS')){run.status='insufficient';run.answer='本次范围缺少跨版本过渡条款，不能仅凭最新日期推断续借是否允许。';}run.taskNext.push('原借用期间与续借申请分开处理；修改业务日期后重新核对适用版本。');}
 }
 if(task.damage){const hasFlow=attach('TASK-DAMAGE');run.status='insufficient';run.answer=hasFlow?'损坏后应停止使用、拍照并联系设备负责人。现有资料没有赔偿金额，不能推算费用。':'本次日期下缺少可适用的损坏处理条款，流程与金额都需要向设备负责人核实。';run.taskNext.push('补充赔偿计价条款或询问设备负责人。');}
 if(task.missing){run.status='insufficient';run.answer='当前资料未提供平板电脑借用规则；不能把笔记本电脑或显示器规定套用。';run.citations=[];run.facts=[];}
 run.checks={...run.checks,citation:inspectCitations(run.citations,run.retrieved)?'matched':'not-applicable'};
 run.excluded=excludedEvidence(docs,scope,run.retrieved,run.citations);
 run.taskNext.push('核对引用后编辑对外答复；本页不会提交借用或审批。');
 return run;
}
