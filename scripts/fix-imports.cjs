// Dev helper: rebuild each src/game module's named imports from what it actually uses.
// Names come from the game modules first, then src/logic, src/data and (as type-only imports) src/types.
// Side-effect imports and `import * as x` namespace imports are kept as written.
const ts=require('typescript'),fs=require('fs');
const dir='src/game',mods=fs.readdirSync(dir).filter(f=>f.endsWith('.ts')).map(f=>f.slice(0,-3));
const parse=p=>ts.createSourceFile(p,fs.readFileSync(p,'utf8'),ts.ScriptTarget.Latest,true);
const exported=st=>!!(st.modifiers&&st.modifiers.some(m=>m.kind===ts.SyntaxKind.ExportKeyword));
const declsOf=(sf,onlyExported)=>{const out=[];for(const st of sf.statements){if(onlyExported&&!exported(st))continue;
  if((ts.isFunctionDeclaration(st)||ts.isInterfaceDeclaration(st)||ts.isTypeAliasDeclaration(st))&&st.name)out.push([st.name.text,ts.isInterfaceDeclaration(st)||ts.isTypeAliasDeclaration(st)]);
  if(ts.isVariableStatement(st))st.declarationList.declarations.forEach(d=>ts.isIdentifier(d.name)&&out.push([d.name.text,false]))}return out};
const owner={},isType={};
const addOwner=(file,spec,onlyNew)=>declsOf(parse(file),true).forEach(([n,t])=>{if(onlyNew&&owner[n])return;owner[n]=spec;isType[n]=t});
const info={};
for(const m of mods){const sf=parse(`${dir}/${m}.ts`);info[m]={sf};declsOf(sf,true).forEach(([n,t])=>{owner[n]='./'+m;isType[n]=t})}
for(const f of fs.readdirSync('src/logic').filter(f=>f.endsWith('.ts')&&!f.endsWith('.test.ts')))addOwner('src/logic/'+f,'../logic/'+f.slice(0,-3),true);
addOwner('src/data.ts','../data',true);addOwner('src/types.ts','../types',true);
for(const m of mods){const {sf}=info[m];const decl=new Set(declsOf(sf).map(x=>x[0])),used=new Set(),keep=[];
  for(const st of sf.statements){
    if(ts.isImportDeclaration(st)){const nb=st.importClause&&st.importClause.namedBindings;if(!st.importClause||(nb&&ts.isNamespaceImport(nb))){keep.push(st.getText(sf));if(nb)decl.add(nb.name.text)}continue}
    const walk=n=>{if(ts.isIdentifier(n)){const p=n.parent;if(p&&(ts.isPropertyAccessExpression(p)||ts.isQualifiedName(p))&&(p.name===n||p.right===n))return;if(p&&(ts.isPropertyAssignment(p)||ts.isPropertySignature(p)||ts.isMethodDeclaration(p))&&p.name===n)return;used.add(n.text)}ts.forEachChild(n,walk)};walk(st)}
  const imp={},timp={};
  for(const n of used){if(decl.has(n)||!owner[n]||owner[n]==='./'+m)continue;const bag=isType[n]?timp:imp;(bag[owner[n]]=bag[owner[n]]||new Set()).add(n)}
  const rank=k=>k==='../types'?0:k==='../data'?1:k.startsWith('../logic')?2:3;
  const lines=[...keep,...Object.keys(timp).sort((a,b)=>rank(a)-rank(b)||a.localeCompare(b)).map(k=>`import type {${[...timp[k]].sort().join(',')}} from '${k}';`),
    ...Object.keys(imp).sort((a,b)=>rank(a)-rank(b)||a.localeCompare(b)).map(k=>`import {${[...imp[k]].sort().join(',')}} from '${k}';`)];
  const body=sf.statements.filter(s=>!ts.isImportDeclaration(s)).map(s=>sf.text.slice(s.getFullStart(),s.end)).join('');
  fs.writeFileSync(`${dir}/${m}.ts`,lines.join('\n')+'\n\n'+body.replace(/^\s+/,'')+'\n');
}
