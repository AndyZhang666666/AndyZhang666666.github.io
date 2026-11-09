import test from 'node:test';
import assert from 'node:assert/strict';
import {FileImportError,fileImportMessage} from '../import-errors.mjs';

test('unknown parser/runtime details never reach the import notice',()=>{
 for(const error of [new TypeError('pdf.destroy is not a function'),new Error('private-stack-at-worker:123'),null,{}]){
  const message=fileImportMessage(error);
  assert.match(message,/粘贴资料原文/);assert.match(message,/原资料与草稿保留/);
  assert.doesNotMatch(message,/destroy|private-stack|worker:123/);
 }
});
test('actionable PDF/size/scan messages survive the safe mapping',()=>{
 for(const [error,expected]of [[{name:'PasswordException',message:'secret'},/已加密.*本机解锁/],[{name:'InvalidPDFException',message:'xref'},/损坏.*重新导出/],[new FileImportError('noText'),/扫描件.*不做OCR/],[new FileImportError('fileTooLarge'),/超过2MB.*拆|超过2MB.*较小文件/],[new FileImportError('textTooLong'),/文本过长.*拆分/]]){
  assert.match(fileImportMessage(error),expected);
 }
});
