// แปลงสตริง JS → สตริง Lua ที่ปลอดภัย (JSON.stringify ให้ \uXXXX ซึ่ง Lua 5.1/Luau ไม่รองรับ และอาจทำให้ loader พังทั้งก้อน)
export const luaStr = (s) => '"' + String(s ?? '').replace(/[\\"\u0000-\u001f\u007f\u2028\u2029]/g, c => {
  if(c === '\\') return '\\\\'; if(c === '"') return '\\"'; if(c === '\n') return '\\n'; if(c === '\r') return '\\r'; if(c === '\t') return '\\t';
  return '\\' + String(c.charCodeAt(0)).padStart(3, '0'); }) + '"';
