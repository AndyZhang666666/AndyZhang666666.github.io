// Import failures are product messages. Never expose parser or runtime error text.
const messages = Object.freeze({
 fileTooLarge:'文件超过2MB。请压缩或分成较小文件后重试。',
 unsupported:'仅支持TXT、Markdown、文字版PDF；请转换格式，或粘贴资料原文。',
 textTooLong:'提取文本过长。请拆分资料后重试，或只粘贴需要检索的部分。',
 noText:'未提取到文字。扫描件可先转成文本，再粘贴导入；本工具不做OCR。',
 empty:'文件没有文字。请核对文件，或粘贴资料原文。',
 password:'PDF已加密，请先在本机解锁或改用可读取文本；本工具不索取密码。',
 damaged:'PDF已损坏或格式不完整，请重新导出文字版PDF，或粘贴资料原文；原资料与草稿保留。',
 unreadable:'该文件暂时无法提取文字。请重新导出文字版PDF、TXT或Markdown，或展开下方「粘贴资料原文」；原资料与草稿保留。'
});
export class FileImportError extends Error {
 constructor(code){super(messages[code]||messages.unreadable);this.name='FileImportError';this.code=code;}
}
export function fileImportMessage(error){
 if(error instanceof FileImportError)return messages[error.code]||messages.unreadable;
 if(error?.name==='PasswordException')return messages.password;
 if(error?.name==='InvalidPDFException')return messages.damaged;
 return messages.unreadable;
}
