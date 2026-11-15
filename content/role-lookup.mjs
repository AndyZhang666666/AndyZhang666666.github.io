// The published homepage and the full site generator share this sample and asset revision.
export const strategySample = '<button type="button" class="jd-sample" data-zh="搜推 / 策略产品" data-en="Search / Strategy PM" data-jd="优化商品推荐与用户触达策略；用 A/B 实验观察转化和留存；与算法团队协作验证搜索排序模型。" data-jd-en="Improve product recommendations and user outreach; use A/B tests to assess conversion and retention; collaborate with the algorithms team to validate search ranking models.">搜推 / 策略产品</button>';

export function updateRoleLookup(html) {
  if (!html.includes('id="jdInput"')) return html;
  if (!html.includes('data-en="Search / Strategy PM"')) {
    html = html.replace(/(<div class="jd-samples">[\s\S]*?)(\n    <\/div>)/, (_, buttons, end) => buttons + '\n      ' + strategySample + end);
  }
  return html.replace(/src="jd\.js\?v=[^"]*"/, 'src="jd.js?v=20261115-strategy1"');
}
