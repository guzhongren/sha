const echartsShortcodePattern = /\{\{<\s*echarts\s*>\}\}([\s\S]*?)\{\{<\s*\/echarts\s*>\}\}/g;

export function transformContentShortcodes(source: string) {
  return source.replace(echartsShortcodePattern, (_match, options: string) => {
    const payload = options.trim();
    return `\n\n<figure class="echarts-frame"><div class="echarts-canvas" data-echarts-options="${encodeURIComponent(payload)}"></div></figure>\n\n`;
  });
}
