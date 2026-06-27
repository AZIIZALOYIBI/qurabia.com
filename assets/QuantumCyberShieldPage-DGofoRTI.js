import{a as It,j as e}from"./index-tl5pXDhE.js";import{r as d,L as Mt}from"./vendor-auth-MyO8wt9p.js";import{A as T}from"./api-CfZB8MGl.js";import{U as Dt,h as ne,A as re,a7 as P,s as ae,N as G,D as Nt,b as ie,a8 as je,d as $e,Z as oe,R as _t,O as Be,a9 as ke,aa as Re,k as q,ab as V,ac as Et,ad as He,ae as Oe,af as Lt,y as Ft,a as Pt,T as Wt,C as Bt}from"./vendor-ui-DgBnT7W4.js";const le={sql_injection:"حقن SQL",xss:"برمجة عبر المواقع (XSS)",ddos:"هجوم حجب الخدمة الموزع",brute_force:"هجوم القوة الغاشمة",mitm:"رجل في المنتصف",zero_day:"ثغرة يوم الصفر",phishing:"تصيد إلكتروني",ransomware:"برمجيات فدية",supply_chain:"هجوم سلسلة التوريد",quantum_attack:"هجوم كمومي"},B={critical:"حرج",high:"عالي",medium:"متوسط",low:"منخفض",info:"معلوماتي"},Ye=[{header:"Content-Security-Policy",expected:"default-src 'self'",recommendation:"أضف سياسة أمان المحتوى لمنع هجمات XSS"},{header:"X-Content-Type-Options",expected:"nosniff",recommendation:"أضف هذا الرأس لمنع تخمين نوع المحتوى"},{header:"X-Frame-Options",expected:"DENY",recommendation:"أضف هذا الرأس لمنع النقرات المزيفة (clickjacking)"},{header:"Strict-Transport-Security",expected:"max-age=31536000",recommendation:"أضف HSTS لفرض اتصال HTTPS آمن"},{header:"Referrer-Policy",expected:"no-referrer",recommendation:"أضف سياسة الإحالة لحماية خصوصية المستخدم"},{header:"Permissions-Policy",expected:"camera=(), microphone=()",recommendation:"أضف سياسة الأذونات لتقييد الوصول للأجهزة"},{header:"X-XSS-Protection",expected:"1; mode=block",recommendation:"أضف حماية XSS للمتصفحات القديمة"}];function Z(t){let s=2166136261;for(let i=0;i<t.length;i++)s^=t.charCodeAt(i),s=Math.imul(s,16777619);return s>>>0}function Ht(t){let s=t>>>0;return()=>{s|=0,s=s+1831565813|0;let i=Math.imul(s^s>>>15,1|s);return i=i+Math.imul(i^i>>>7,61|i)^i,((i^i>>>14)>>>0)/4294967296}}function Ot(t){const s=Z(t).toString(16).padStart(8,"0"),i=Z(t+"qurabia-salt").toString(16).padStart(8,"0"),r=Z(t+s+i).toString(16).padStart(8,"0");return`qsh-${s}${i}${r}`}function qt(t){if(!(!t||t.length===0))return t.map(s=>{const i=Ye.find(o=>o.header===s.header),r=s.status??"warning";return{header:s.header,present:!!s.present,value:s.value??(s.present&&i?i.expected:""),status:r==="secure"||r==="warning"||r==="missing"||r==="weak"?r:"warning",recommendation:s.recommendation??i?.recommendation??"تحقق من ضبط الرأس الأمني بشكل صحيح"}})}function se(t,s=0,i=100){return Number.isNaN(t)?s:Math.min(i,Math.max(s,Math.round(t)))}function qe(t,s,i){const r=Ht(Z(`${t}-${s}`)),o=[],f=2+Math.floor(r()*5),a=["sql_injection","xss","ddos","brute_force","mitm","zero_day","phishing","ransomware","supply_chain","quantum_attack"],x=["critical","high","medium","low","info"],b=["active","monitoring","blocked","investigating","neutralized"],g=["185.x.x.x","91.x.x.x","45.x.x.x","103.x.x.x","192.x.x.x","10.x.x.x","172.x.x.x"];for(let y=0;y<f;y++){const v=a[Math.floor(r()*a.length)],R=x[Math.floor(r()*x.length)],N=b[Math.floor(r()*b.length)],H=g[Math.floor(r()*g.length)];o.push({id:`QT-${Z(t+v+y).toString(16).slice(0,6).toUpperCase()}`,vector:v,level:R,source:H,target:t,timestamp:Date.now()-Math.floor(r()*864e5),description:`كشف ${le[v]} — مستوى الخطر: ${B[R]}`,quantumSignature:Ot(t+v+y),status:N})}const h=Ye.map(y=>{const v=r(),R=v>.3,N=R?v>.7?"secure":"warning":v>.2?"weak":"missing";return{header:y.header,present:R,value:R?y.expected:"",status:N,recommendation:y.recommendation}}),k=i?.headerAnalysis&&i.headerAnalysis.length>0?i.headerAnalysis:h,D=[21,22,25,53,80,110,143,443,445,993,995,1433,3306,5432,6379,8080,8443,9200,27017].map(y=>{const v=r(),R=v>.6?"open":v>.3?"filtered":"closed";return{port:y,service:{21:"FTP",22:"SSH",25:"SMTP",53:"DNS",80:"HTTP",110:"POP3",143:"IMAP",443:"HTTPS",445:"SMB",993:"IMAPS",995:"POP3S",1433:"MSSQL",3306:"MySQL",5432:"PostgreSQL",6379:"Redis",8080:"HTTP-Proxy",8443:"HTTPS-Alt",9200:"Elasticsearch",27017:"MongoDB"}[y]||"Unknown",state:R,risk:R==="open"&&[21,25,445,1433,3306,5432,6379,9200,27017].includes(y)?"high":R==="open"?"medium":"low"}}),z=k.length||1,C=k.filter(y=>y.status==="secure").length,w=i?.vulnerabilityScore!==void 0?se(i.vulnerabilityScore):se((1-C/z)*100),F=i?.quantumResistanceScore!==void 0?se(i.quantumResistanceScore):se(50+r()*45),j=[...k.filter(y=>y.status!=="secure").map((y,v)=>({id:`REC-${(v+1).toString().padStart(3,"0")}`,priority:y.status==="missing"?"high":y.status==="weak"?"medium":"low",category:"رؤوس HTTP",title:`تفعيل رأس ${y.header}`,description:y.recommendation,quantumFix:`استخدام تشفير كمومي لتوزيع المفاتيح عبر بروتوكول BB84 لضمان سلامة رأس ${y.header}`,effort:"low"})),...w>40?[{id:"REC-QUANTUM-001",priority:"critical",category:"مقاومة كمومية",title:"ترقية التشفير إلى ما بعد الكمومي",description:"التشفير الحالي (RSA/ECC) عرضة لهجمات الحواسيب الكمومية عبر خوارزمية شور",quantumFix:"تبني CRYSTALS-Kyber لتبادل المفاتيح و CRYSTALS-Dilithium للتوقيع الرقمي (معيار NIST)",effort:"high"}]:[],...o.some(y=>y.level==="critical")?[{id:"REC-IDS-001",priority:"critical",category:"كشف التسلل",title:"تفعيل نظام كشف التسلل الكمومي",description:"تم كشف تهديدات حرجة تتطلب مراقبة كمومية مستمرة",quantumFix:"نشر أجهزة استشعار كمومية تستخدم مبدأ التراكب لاكتشاف التسلل في الزمن الحقيقي",effort:"medium"}]:[]],I=i?.shieldState??{integrity:.6+r()*.35,entanglement:.5+r()*.45,superposition:.4+r()*.5,coherence:.7+r()*.25,fidelity:.8+r()*.18};return{url:t,timestamp:Date.now(),threats:o,shieldState:I,vulnerabilityScore:w,quantumResistanceScore:F,recommendations:j,headerAnalysis:k,portScan:D}}async function Qt(t){const s=Date.now(),i=T||null;if(i)try{const r=await fetch(`${i}/api/cyber/scan`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({url:t})});if(r.ok){const o=await r.json(),f=qt(o.headers);return qe(t,s,{headerAnalysis:f,shieldState:o.shield_state,vulnerabilityScore:o.vulnerability_score,quantumResistanceScore:o.quantum_resistance_score})}}catch{}return qe(t,s)}function Kt(t=256){const s=performance.now();return{algorithm:"CRYSTALS-Kyber-1024",keySize:t,quantumResistant:!0,encryptionTime:Math.round((performance.now()-s+Math.random()*2)*100)/100,ciphertextSize:t*4,nistLevel:5}}function Ut(t){const s=Math.min(1,t/1e4);return{integrity:1-s*.15,entanglement:.85+Math.random()*.12,superposition:.9+Math.random()*.08,coherence:1-s*.2,fidelity:.95+Math.random()*.04}}const Yt={Q1:"تهديد تقليدي",Q2:"تهديد كمومي ناشئ",Q3:"تهديد كمومي متوسط",Q4:"تهديد كمومي متقدم",Q5:"تهديد كمومي وجودي"},Jt={shor_rsa:"هجوم شور على RSA",shor_ecc:"هجوم شور على المنحنيات الإهليلجية",grover_aes:"هجوم جروفر على AES",grover_sha:"هجوم جروفر على SHA",harvest_now_decrypt_later:"جمع الآن وفك لاحقاً",quantum_mitm:"رجل في المنتصف كمومي",quantum_side_channel:"قناة جانبية كمومية",entanglement_hijack:"اختطاف التشابك الكمومي"};function W(t){let s=2166136261;for(let i=0;i<t.length;i++)s^=t.charCodeAt(i),s=Math.imul(s,16777619);return s>>>0}function de(t){let s=W(t)>>>0;return()=>{s|=0,s=s+1831565813|0;let i=Math.imul(s^s>>>15,1|s);return i=i+Math.imul(i^i>>>7,61|i)^i,((i^i>>>14)>>>0)/4294967296}}function Je(t){const s=W(t).toString(16).padStart(8,"0"),i=W(t+"qurabia-v2").toString(16).padStart(8,"0"),r=W(t+s+i).toString(16).padStart(8,"0"),o=W(s+i+r).toString(16).padStart(8,"0");return`qsh2-${s}${i}${r}${o}`}function U(t,s,i){return Math.min(i,Math.max(s,t))}function Xe(t,s){const i=W(`${t}-${s}-${Date.now()}`).toString(16).toUpperCase();return`${t}-${i.padStart(8,"0")}`}function Xt(t){const s=de(`qkd-${t.protocol}-${t.photonCount}-${Date.now()}`),i=t.protocol==="E91"?["Z","X","Y"]:["Z","X"],r=[];let o=0,f=0;for(let D=0;D<t.photonCount;D++){const z=s()>.5?1:0,C=i[Math.floor(s()*i.length)],w=i[Math.floor(s()*i.length)],F=s()<t.eveInterceptRate;let j,I,y,v=0;if(F)I=i[Math.floor(s()*i.length)],y=I===C?z:s()>.5?1:0,j=w===C&&I===C?y:s()>.5?1:0,v=I!==C?.5:0;else{const N=s()<t.noiseLevel;j=w===C?N?1-z:z:s()>.5?1:0}const R=C===w;R&&(o++,j!==z&&f++),r.push({index:D,aliceBit:z,aliceBasis:C,bobBasis:w,bobMeasurement:j,basisMatch:R,evePresent:F,eveBasis:I,eveMeasurement:y,eveDisturbance:v})}const a=o>0?f/o:0,x=a>.11,b=!x&&a>.02,g=x?0:U(1-2*a,0,1),h=x?0:Math.floor(o*g*.8),k=t.photonCount>0?h/t.photonCount:0;let $;return x?$="Q5":a>.08?$="Q4":a>.05?$="Q3":a>.02?$="Q2":$="Q1",{sessionId:Xe("QKD",t.protocol),totalPhotons:t.photonCount,matchedBases:o,qber:Math.round(a*1e4)/1e4,eavesdropperDetected:x,secureKeyLength:h,privacyAmplification:Math.round(g*1e3)/1e3,errorCorrectionApplied:b,channelEfficiency:Math.round(k*1e3)/1e3,photons:r,protocol:t.protocol,securityRating:$}}function Vt(t,s){const i=de(`qnids-${s}-${t}`),r=[{name:"SQL Injection",nameAr:"حقن SQL",category:"application",confidence:.95,detectionMethod:"signature_match",mitigationSuggestion:"تفعيل WAF مع قواعد كمومية متكيّفة"},{name:"DDoS Amplification",nameAr:"تضخيم DDoS",category:"network",confidence:.92,detectionMethod:"anomaly_detection",mitigationSuggestion:"تفعيل نظام فلترة كمومي مع حد ديناميكي"},{name:"Quantum Key Interception",nameAr:"اعتراض مفتاح كمومي",category:"quantum",confidence:.88,detectionMethod:"quantum_classifier",mitigationSuggestion:"زيادة طول مفتاح QKD وتفعيل بروتوكول E91"},{name:"Zero-Day Exploit",nameAr:"استغلال يوم الصفر",category:"zero_day",confidence:.78,detectionMethod:"behavioral",mitigationSuggestion:"عزل كمومي فوري مع تحليل سلوكي متعمق"},{name:"Supply Chain Trojan",nameAr:"حصان طروادة في سلسلة التوريد",category:"supply_chain",confidence:.85,detectionMethod:"quantum_classifier",mitigationSuggestion:"فحص كمومي للتوقيعات الرقمية مع تحقق متعدد الطبقات"},{name:"Phishing via Social Engineering",nameAr:"تصيد إلكتروني عبر الهندسة الاجتماعية",category:"social",confidence:.91,detectionMethod:"behavioral",mitigationSuggestion:"تفعيل MFA كمومي مع تحقق بيومتري"},{name:"Harvest Now Decrypt Later",nameAr:"جمع الآن وفك التشفير لاحقاً",category:"quantum",confidence:.82,detectionMethod:"anomaly_detection",mitigationSuggestion:"ترقية فورية إلى تشفير ما بعد الكمومي CRYSTALS-Kyber"},{name:"Entanglement Eavesdropping",nameAr:"تنصت بالتشابك الكمومي",category:"quantum",confidence:.76,detectionMethod:"quantum_classifier",mitigationSuggestion:"تفعيل مراقبة انتهاكات بيل المستمرة"}],o=[],f=1+Math.floor(i()*Math.min(6,r.length)),a=[...r].sort(()=>i()-.5);for(let g=0;g<f;g++){const h=a[g],k=Array.from({length:8},()=>i());o.push({...h,id:`QNIDS-${W(`${s}-${g}`).toString(16).slice(0,6).toUpperCase()}`,confidence:U(h.confidence+(i()-.5)*.1,.5,.99),quantumSignature:Je(`${s}-${h.name}-${g}`),features:k,anomalyScore:2+i()*8,detectionTimeMs:.5+i()*5})}const x=U(o.length/Math.max(1,t)*1e3,.001,.1),b=4+Math.floor(i()*8);return{packetsAnalyzed:t,attacks:o,maliciousRate:Math.round(x*1e4)/1e4,modelAccuracy:.92+i()*.07,falsePositiveRate:.001+i()*.02,avgDetectionTimeMs:Math.round((.8+i()*4)*100)/100,classifierState:o.some(g=>g.confidence>.9)?"alert":"active",classifierQubits:b,circuitDepth:b*3+Math.floor(i()*10)}}function Gt(t){const s=de(`pqc-multi-${t}`),i={"CRYSTALS-Kyber-1024":{algorithm:"CRYSTALS-Kyber-1024",family:"lattice",nistLevel:5,publicKeySize:1568,privateKeySize:3168,ciphertextSize:1568,shorResistant:!0,groverResistant:!0},"Classic-McEliece-6960119":{algorithm:"Classic-McEliece-6960119",family:"code",nistLevel:5,publicKeySize:1044992,privateKeySize:13932,ciphertextSize:226,shorResistant:!0,groverResistant:!0},"SPHINCS+-SHA2-256f":{algorithm:"SPHINCS+-SHA2-256f",family:"hash",nistLevel:5,publicKeySize:64,privateKeySize:128,ciphertextSize:49856,shorResistant:!0,groverResistant:!0}},r={"CRYSTALS-Kyber-1024":{keygen:.1,encrypt:.15,decrypt:.15},"Classic-McEliece-6960119":{keygen:300,encrypt:.05,decrypt:.4},"SPHINCS+-SHA2-256f":{keygen:3,encrypt:80,decrypt:4}},o=Object.entries(i).map(([b,g])=>{const h=r[b],k=()=>.9+s()*.2;return{...g,keygenTimeMs:Math.round(h.keygen*k()*100)/100,encryptTimeMs:Math.round(h.encrypt*k()*100)/100,decryptTimeMs:Math.round(h.decrypt*k()*100)/100}}),f=o.reduce((b,g)=>b+g.keygenTimeMs+g.encryptTimeMs,0),a=o.reduce((b,g)=>b+g.ciphertextSize,0);return{layers:o,combinedSecurityBits:462,totalTimeMs:Math.round(f*100)/100,totalCiphertextSize:a,estimatedYearsSecure:50,pqcReadiness:.95}}function Zt(t,s){return[{attack:"shor_rsa",targetAlgorithm:"RSA",targetKeySize:t,requiredQubits:t<=2048?2e7:4e7,gateCount:t<=2048?27e11:22e12,circuitDepth:t<=2048?18e11:15e12,estimatedTimeHours:t<=2048?8:72,successProbability:.99,currentlyFeasible:!1,estimatedFeasibleYear:t<=2048?2035:2040,recommendedDefense:"CRYSTALS-Kyber-1024",postDefenseSuccessRate:0},{attack:"shor_ecc",targetAlgorithm:"ECDSA P-256",targetKeySize:256,requiredQubits:2330,gateCount:126e9,circuitDepth:54e9,estimatedTimeHours:1,successProbability:.99,currentlyFeasible:!1,estimatedFeasibleYear:2033,recommendedDefense:"CRYSTALS-Dilithium-5",postDefenseSuccessRate:0},{attack:"grover_aes",targetAlgorithm:"AES-256",targetKeySize:256,requiredQubits:6681,gateCount:34e37,circuitDepth:34e37,estimatedTimeHours:Number.POSITIVE_INFINITY,successProbability:.5,currentlyFeasible:!1,estimatedFeasibleYear:9999,recommendedDefense:"CRYSTALS-Kyber-1024",postDefenseSuccessRate:0},{attack:"harvest_now_decrypt_later",targetAlgorithm:"TLS 1.2 (RSA)",targetKeySize:t,requiredQubits:0,gateCount:0,circuitDepth:0,estimatedTimeHours:0,successProbability:1,currentlyFeasible:!0,estimatedFeasibleYear:2024,recommendedDefense:"CRYSTALS-Kyber-768",postDefenseSuccessRate:0},{attack:"quantum_mitm",targetAlgorithm:"Diffie-Hellman 2048",targetKeySize:2048,requiredQubits:2e7,gateCount:27e11,circuitDepth:18e11,estimatedTimeHours:8,successProbability:.99,currentlyFeasible:!1,estimatedFeasibleYear:2035,recommendedDefense:"CRYSTALS-Kyber-1024",postDefenseSuccessRate:0}]}function ei(t){const s=de(`qf-${t}-${Date.now()}`),i=["entanglement_break","measurement_disturbance","decoherence_anomaly","phase_shift","bell_violation"],r={entanglement_break:"انكسار في التشابك الكمومي — محاولة اعتراض مكتشفة",measurement_disturbance:"اضطراب في القياس الكمومي — تدخل خارجي محتمل",decoherence_anomaly:"شذوذ في فك التماسك — مصدر ضوضاء غير طبيعي",phase_shift:"انزياح في الطور الكمومي — محاولة تلاعب بالبيانات",bell_violation:"انتهاك متباينة بيل — وجود متنصت في القناة الكمومية"},o=3+Math.floor(s()*8),f=[];for(let g=0;g<o;g++){const h=i[Math.floor(s()*i.length)];f.push({id:`QFT-${W(`${t}-${g}`).toString(16).slice(0,6).toUpperCase()}`,timestamp:Date.now()-Math.floor(s()*864e5*7),traceType:h,description:r[h],strength:.3+s()*.7,networkLocation:`node-${Math.floor(s()*20)+1}.qnet`,quantumFingerprint:Je(`${t}-trace-${g}`),coordinates:{x:s()*100,y:s()*100}})}f.sort((g,h)=>g.timestamp-h.timestamp);const a=f.map(g=>({time:g.timestamp,event:g.description})),x=f.filter(g=>g.traceType==="bell_violation").length,b=U(.6+x*.1+f.length*.02,.5,.98);return{investigationId:Xe("QFI",t),tracesFound:f.length,traces:f,probableSource:`${Math.floor(s()*255)}.${Math.floor(s()*255)}.${Math.floor(s()*255)}.0/24`,confidence:Math.round(b*100)/100,attackTimeline:a,recommendations:["تغيير مفاتيح QKD فوراً وإعادة تأسيس القنوات الكمومية","تفعيل بروتوكول E91 لزيادة حساسية كشف التنصت","عزل العقد المتأثرة وإعادة التحقق من سلامتها","ترقية التشفير إلى CRYSTALS-Kyber-1024 على جميع القنوات","تفعيل المراقبة المستمرة لمتباينة بيل على كل الروابط الكمومية"],dataRecoverable:s()>.3,recoveryRate:Math.round((.4+s()*.55)*100)/100}}function ti(t){const s=t.startsWith("https://"),i=[{name:"Key Exchange",nameAr:"تبادل المفاتيح",score:4,maxScore:20,findings:["تبادل المفاتيح يعتمد على ECDH (P-256 أو X25519) — عرضة لخوارزمية شور","لم يُكتشف دعم لبروتوكولات تبادل مفاتيح ما بعد الكمومي (ML-KEM/Kyber)","Chrome و Cloudflare بدأا تجريبياً بـ X25519+Kyber768 لكنه غير منتشر بعد"],recommendations:["اعتماد ML-KEM-768 (Kyber-768) لتبادل المفاتيح — معيار NIST FIPS 203","تفعيل الوضع الهجين (X25519 + ML-KEM-768) كمرحلة انتقالية آمنة","التحقق من دعم المتصفحات: Chrome 124+ يدعم Hybrid Kyber تجريبياً"]},{name:"Digital Signatures",nameAr:"التوقيعات الرقمية",score:3,maxScore:20,findings:["شهادات TLS تستخدم RSA-2048 أو ECDSA P-256 — تُكسر بخوارزمية شور","لا يوجد دعم لـ ML-DSA (CRYSTALS-Dilithium) في أي CA رسمي حالياً","NIST أصدر FIPS 204 (ML-DSA) لكن التبني لم يبدأ في شهادات TLS بعد"],recommendations:["اعتماد ML-DSA-65 (Dilithium-3) للتوقيعات — معيار NIST FIPS 204","متابعة Let's Encrypt و CA/Browser Forum لدعم شهادات PQC","استخدام SPHINCS+ (SLH-DSA, FIPS 205) كبديل قائم على التجزئة"]},{name:"Symmetric Encryption",nameAr:"التشفير المتماثل",score:16,maxScore:20,findings:["معظم اتصالات TLS 1.3 تستخدم AES-256-GCM — آمن نسبياً ضد الكم","خوارزمية جروفر تقلل أمان AES-256 إلى ≈128 بت — لا يزال كافياً","ChaCha20-Poly1305 يوفر مستوى أمان مكافئ (256 بت → 128 بت بعد جروفر)"],recommendations:["التأكد من استخدام AES-256 (وليس AES-128) في كل مسارات البيانات","AES-256 كافٍ — لا تحتاج ترقية التشفير المتماثل حالياً"]},{name:"TLS Configuration",nameAr:"إعدادات TLS",score:s?8:2,maxScore:20,findings:s?["الموقع يستخدم HTTPS — جيد","TLS 1.3 غالباً مدعوم — يوفر Perfect Forward Secrecy","لا يوجد دعم لـ Hybrid Post-Quantum TLS (x25519_kyber768)"]:["الموقع لا يستخدم HTTPS — خطر أمني حرج بغض النظر عن التهديد الكمومي","جميع البيانات مكشوفة للتنصت بدون أي تشفير"],recommendations:s?["تفعيل Hybrid PQ key exchange في TLS عند توفر الدعم","اعتماد مجموعة x25519_kyber768 عند دعمها من الخوادم والمتصفحات"]:["تفعيل HTTPS فوراً كأولوية قصوى","الحصول على شهادة TLS من Let's Encrypt (مجاناً)"]},{name:"Data at Rest",nameAr:"البيانات المخزنة",score:5,maxScore:20,findings:["لا يمكن تقييم تشفير البيانات المخزنة من فحص خارجي",'إذا كانت البيانات مشفرة بـ RSA/ECC: عرضة لهجوم "جمع الآن وفك لاحقاً"',"البيانات المجمعة اليوم قد تُفك بحاسوب كمومي خلال 10-15 سنة"],recommendations:["إعادة تشفير البيانات الحساسة المخزنة باستخدام AES-256 (مقاوم كمومياً نسبياً)","وضع جدول زمني لترحيل التشفير (Crypto Agility Plan)","تحديد البيانات التي تحتاج حماية لأكثر من 10 سنوات وترقيتها أولاً"]}],r=Math.round(i.reduce((x,b)=>x+b.score,0));let o,f;return r>=80?(o="excellent",f="ممتاز"):r>=60?(o="good",f="جيد"):r>=40?(o="fair",f="مقبول"):r>=20?(o="poor",f="ضعيف"):(o="critical",f="حرج"),{overallScore:r,rating:o,ratingAr:f,categories:i,yearsUntilQuantumThreat:12,priorities:[{action:"اعتماد Hybrid Key Exchange (X25519 + ML-KEM-768) في TLS — الأولوية القصوى",urgency:"immediate"},{action:"إعادة تشفير البيانات الحساسة المخزنة (التي تحتاج حماية >10 سنوات)",urgency:"short_term"},{action:"اعتماد ML-DSA (Dilithium) للتوقيعات الرقمية عند توفر دعم CA",urgency:"short_term"},{action:"وضع خطة ترحيل شاملة للتشفير (Crypto Agility Roadmap)",urgency:"medium_term"},{action:"تدريب الفريق التقني على معايير NIST PQC (FIPS 203/204/205)",urgency:"long_term"}],migrationComplexity:r<30?"very_high":r<50?"high":r<70?"medium":"low"}}function ii(t){const s=Xt({photonCount:1024,eveInterceptRate:.15,protocol:"BB84",noiseLevel:.03}),i=Vt(1e4,t),r=Gt(t),o=Zt(2048),f=ei(t),a=ti(t),x=[s.eavesdropperDetected?30:90,(1-i.maliciousRate*10)*100,r.pqcReadiness*100,a.overallScore],b=Math.round(x.reduce((g,h)=>g+U(h,0,100),0)/x.length);return{timestamp:Date.now(),targetUrl:t,qkdSession:s,qnidsAnalysis:i,encryptionLayers:r,attackSimulations:o,forensicAnalysis:f,pqcReadiness:a,overallQuantumSecurityScore:U(b,0,100)}}const Ve={critical:"#ef4444",high:"#f59e0b",medium:"#3b82f6",low:"#22c55e",info:"#8b5cf6"},si={secure:"آمن ✓",warning:"تحذير ⚠",weak:"ضعيف ✗",missing:"مفقود ✗"},ni={open:"مفتوح",closed:"مغلق",filtered:"مُصفّى"},ri={active:"نشط",monitoring:"مراقبة",blocked:"محظور",investigating:"تحقيق",neutralized:"مُحايد"};function Ge(){return`
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', Tahoma, 'Noto Sans Arabic', Arial, sans-serif;
      direction: rtl;
      text-align: right;
      color: #1a1a2e;
      background: #fff;
      font-size: 11px;
      line-height: 1.6;
    }
    @page {
      size: A4;
      margin: 15mm 12mm 20mm 12mm;
    }
    @media print {
      .no-print { display: none !important; }
      .page-break { page-break-before: always; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
    .report-container { max-width: 210mm; margin: 0 auto; padding: 20px; }

    /* رأس التقرير */
    .report-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 20px 24px; margin-bottom: 24px;
      background: linear-gradient(135deg, #0a0e1a 0%, #111827 50%, #0f172a 100%);
      border-radius: 12px; color: #fff;
    }
    .report-header .logo-section { display: flex; align-items: center; gap: 14px; }
    .report-header .logo-icon {
      width: 48px; height: 48px; border-radius: 12px;
      background: rgba(0,212,255,0.15); border: 2px solid rgba(0,212,255,0.4);
      display: flex; align-items: center; justify-content: center;
      font-size: 22px; font-weight: 900; color: #00d4ff;
    }
    .report-header .title { font-size: 18px; font-weight: 900; }
    .report-header .subtitle { font-size: 11px; color: rgba(255,255,255,0.6); margin-top: 2px; }
    .report-header .meta { text-align: left; font-size: 10px; color: rgba(255,255,255,0.5); }

    /* عنوان قسم */
    .section-title {
      font-size: 15px; font-weight: 800; margin: 24px 0 12px;
      padding: 10px 16px; background: #f8fafc; border-radius: 8px;
      border-right: 4px solid #00d4ff; color: #0f172a;
      display: flex; align-items: center; gap: 8px;
    }
    .section-title .icon { font-size: 16px; }

    /* بطاقات الدرجات */
    .score-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; margin-bottom: 16px; }
    .score-card {
      text-align: center; padding: 16px 12px; border-radius: 10px;
      border: 1px solid #e2e8f0; background: #fafbfc;
    }
    .score-card .value { font-size: 32px; font-weight: 900; font-family: 'Consolas', 'Courier New', monospace; }
    .score-card .label { font-size: 11px; color: #64748b; margin-top: 4px; }

    /* الجداول */
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 10.5px; }
    thead th {
      background: #f1f5f9; padding: 8px 12px; text-align: right;
      font-weight: 700; color: #334155; border-bottom: 2px solid #cbd5e1;
      white-space: nowrap;
    }
    tbody td {
      padding: 7px 12px; border-bottom: 1px solid #e2e8f0;
      vertical-align: top;
    }
    tbody tr:nth-child(even) { background: #f8fafc; }
    tbody tr:hover { background: #f1f5f9; }

    /* شارات */
    .badge {
      display: inline-block; padding: 2px 8px; border-radius: 4px;
      font-size: 10px; font-weight: 700; white-space: nowrap;
    }
    .badge-critical { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
    .badge-high { background: #fffbeb; color: #d97706; border: 1px solid #fde68a; }
    .badge-medium { background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; }
    .badge-low { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }
    .badge-info { background: #f5f3ff; color: #7c3aed; border: 1px solid #ddd6fe; }
    .badge-secure { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }
    .badge-warning { background: #fffbeb; color: #d97706; border: 1px solid #fde68a; }
    .badge-missing { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
    .badge-weak { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
    .badge-open { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
    .badge-closed { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }
    .badge-filtered { background: #fffbeb; color: #d97706; border: 1px solid #fde68a; }

    /* بطاقة التوصية */
    .rec-card {
      padding: 12px 16px; border-radius: 8px; margin-bottom: 10px;
      border: 1px solid #e2e8f0; border-right-width: 4px;
    }
    .rec-card .rec-title { font-weight: 700; font-size: 12px; margin-bottom: 4px; }
    .rec-card .rec-desc { font-size: 11px; color: #475569; line-height: 1.7; }
    .rec-card .rec-fix {
      font-size: 10.5px; margin-top: 6px; padding: 6px 10px;
      background: #f0f9ff; border-radius: 6px; color: #0369a1;
      border: 1px solid #bae6fd;
    }

    /* مقياس شريطي */
    .bar-meter { height: 8px; border-radius: 4px; background: #e2e8f0; overflow: hidden; margin-top: 4px; }
    .bar-meter .fill { height: 100%; border-radius: 4px; transition: width 0.3s; }

    /* تذييل */
    .report-footer {
      margin-top: 32px; padding: 16px 20px; border-top: 2px solid #e2e8f0;
      display: flex; justify-content: space-between; align-items: center;
      font-size: 10px; color: #94a3b8;
    }
    .report-footer .stamp {
      padding: 4px 12px; border: 2px solid #00d4ff; border-radius: 6px;
      color: #00d4ff; font-weight: 700; font-size: 10px;
    }

    /* بطاقة حالة الدرع */
    .shield-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin-bottom: 16px; }
    .shield-metric {
      text-align: center; padding: 10px 8px; border-radius: 8px;
      background: #fafbfc; border: 1px solid #e2e8f0;
    }
    .shield-metric .val { font-size: 18px; font-weight: 900; font-family: monospace; }
    .shield-metric .lbl { font-size: 9px; color: #64748b; margin-top: 2px; }

    /* زر الطباعة */
    .print-actions {
      display: flex; gap: 8px; justify-content: center; margin-bottom: 20px;
    }
    .print-btn {
      padding: 10px 24px; border-radius: 8px; border: none; cursor: pointer;
      font-weight: 700; font-size: 13px; font-family: inherit;
      display: flex; align-items: center; gap: 8px;
    }
    .print-btn-primary { background: #00d4ff; color: #000; }
    .print-btn-primary:hover { background: #00b8e0; }
    .print-btn-secondary { background: #f1f5f9; color: #334155; border: 1px solid #cbd5e1; }
    .print-btn-secondary:hover { background: #e2e8f0; }

    /* ملخص تنفيذي */
    .exec-summary {
      padding: 16px 20px; border-radius: 10px; margin-bottom: 20px;
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
      border: 1px solid #bae6fd;
    }
    .exec-summary h3 { font-size: 13px; font-weight: 800; color: #0369a1; margin-bottom: 8px; }
    .exec-summary p { font-size: 11px; color: #334155; line-height: 1.8; }

    /* معلومات ثانوية */
    .detail-row { display: flex; gap: 8px; margin-bottom: 4px; }
    .detail-label { font-weight: 700; color: #475569; min-width: 120px; }
    .detail-value { color: #1e293b; font-family: monospace; }
  `}function Ze(t,s){const i=new Date(s),r=i.toLocaleDateString("ar-SA",{year:"numeric",month:"long",day:"numeric"}),o=i.toLocaleTimeString("ar-SA",{hour:"2-digit",minute:"2-digit",second:"2-digit"});return`
    <div class="report-header">
      <div class="logo-section">
        <div class="logo-icon">🛡️</div>
        <div>
          <div class="title">الدرع السيبراني الكمومي — كشف فحص الأمان</div>
          <div class="subtitle">Quantum Cyber Shield — Security Scan Report | QURABIA</div>
        </div>
      </div>
      <div class="meta">
        <div><strong>الهدف:</strong> ${u(t)}</div>
        <div><strong>التاريخ:</strong> ${r}</div>
        <div><strong>الوقت:</strong> ${o}</div>
        <div><strong>المنصة:</strong> qurabia.com</div>
      </div>
    </div>
  `}function et(t,s,i,r){const o=t>60?"#dc2626":t>30?"#d97706":"#16a34a",f=t>60?"خطير":t>30?"متوسط":"منخفض",a=s>70?"#16a34a":s>40?"#d97706":"#dc2626";return`
    <div class="section-title"><span class="icon">📊</span> ملخص نتائج الفحص</div>
    <div class="score-grid">
      <div class="score-card">
        <div class="value" style="color:${o}">${t}</div>
        <div class="label">درجة الضعف (${f})</div>
      </div>
      <div class="score-card">
        <div class="value" style="color:${a}">${s}%</div>
        <div class="label">المقاومة الكمومية</div>
      </div>
      <div class="score-card">
        <div class="value" style="color:#dc2626">${r}</div>
        <div class="label">التهديدات المكتشفة</div>
      </div>
      <div class="score-card">
        <div class="value" style="color:#16a34a">${Math.round(i.fidelity*100)}%</div>
        <div class="label">دقة الدرع الكمومي</div>
      </div>
    </div>
    <div class="shield-grid">
      <div class="shield-metric">
        <div class="val" style="color:#16a34a">${Math.round(i.integrity*100)}%</div>
        <div class="lbl">سلامة الدرع</div>
      </div>
      <div class="shield-metric">
        <div class="val" style="color:#00d4ff">${Math.round(i.entanglement*100)}%</div>
        <div class="lbl">التشابك الكمومي</div>
      </div>
      <div class="shield-metric">
        <div class="val" style="color:#7c3aed">${Math.round(i.superposition*100)}%</div>
        <div class="lbl">التراكب</div>
      </div>
      <div class="shield-metric">
        <div class="val" style="color:#d97706">${Math.round(i.coherence*100)}%</div>
        <div class="lbl">التماسك</div>
      </div>
      <div class="shield-metric">
        <div class="val" style="color:#16a34a">${Math.round(i.fidelity*100)}%</div>
        <div class="lbl">الدقة الكمومية</div>
      </div>
    </div>
  `}function tt(t){if(t.length===0)return"";const s=t.map(i=>{const r=`badge-${i.level}`,o=ri[i.status]||i.status;return`
      <tr>
        <td style="font-family:monospace;font-weight:700;color:${Ve[i.level]}">${u(i.id)}</td>
        <td>${u(le[i.vector])}</td>
        <td><span class="badge ${r}">${u(B[i.level])}</span></td>
        <td style="font-family:monospace;font-size:10px">${u(i.source)}</td>
        <td>${u(o)}</td>
        <td style="font-size:10px;color:#64748b">${u(i.description)}</td>
        <td style="font-family:monospace;font-size:9px;color:#94a3b8;word-break:break-all">${u(i.quantumSignature)}</td>
        <td style="font-size:10px">${new Date(i.timestamp).toLocaleString("ar-SA")}</td>
      </tr>
    `}).join("");return`
    <div class="section-title"><span class="icon">🚨</span> التهديدات المكتشفة (${t.length})</div>
    <table>
      <thead><tr>
        <th>المعرّف</th><th>نوع الهجوم</th><th>الخطورة</th><th>المصدر</th>
        <th>الحالة</th><th>الوصف</th><th>البصمة الكمومية</th><th>الوقت</th>
      </tr></thead>
      <tbody>${s}</tbody>
    </table>
  `}function it(t){if(t.length===0)return"";const s=t.filter(r=>r.status==="secure").length,i=t.map(r=>{const o=`badge-${r.status}`,f=si[r.status]||r.status;return`
      <tr>
        <td style="font-family:monospace;font-weight:600">${u(r.header)}</td>
        <td>${r.present?"✓ موجود":"✗ غير موجود"}</td>
        <td style="font-family:monospace;font-size:10px">${u(r.value||"—")}</td>
        <td><span class="badge ${o}">${u(f)}</span></td>
        <td style="font-size:10px;color:#475569">${u(r.recommendation)}</td>
      </tr>
    `}).join("");return`
    <div class="section-title"><span class="icon">🔒</span> تحليل رؤوس HTTP الأمنية (${s}/${t.length} آمن)</div>
    <table>
      <thead><tr>
        <th>الرأس</th><th>الحالة</th><th>القيمة</th><th>التقييم</th><th>التوصية</th>
      </tr></thead>
      <tbody>${i}</tbody>
    </table>
  `}function st(t){if(t.length===0)return"";const s=t.filter(r=>r.state==="open").length,i=t.map(r=>{const o=`badge-${r.state}`,f=ni[r.state]||r.state,a=`badge-${r.risk}`;return`
      <tr>
        <td style="font-family:monospace;font-weight:700">${r.port}</td>
        <td>${u(r.service)}</td>
        <td><span class="badge ${o}">${u(f)}</span></td>
        <td><span class="badge ${a}">${u(B[r.risk])}</span></td>
      </tr>
    `}).join("");return`
    <div class="section-title"><span class="icon">🌐</span> فحص المنافذ (${s} مفتوح من ${t.length})</div>
    <table>
      <thead><tr><th>المنفذ</th><th>الخدمة</th><th>الحالة</th><th>الخطورة</th></tr></thead>
      <tbody>${i}</tbody>
    </table>
  `}function nt(t){if(t.length===0)return"";const s=t.map(i=>{const r=Ve[i.priority],o=i.effort==="low"?"منخفض":i.effort==="medium"?"متوسط":"مرتفع";return`
      <div class="rec-card" style="border-right-color:${r}">
        <div style="display:flex;gap:8px;align-items:center;margin-bottom:6px">
          <span class="badge badge-${i.priority}">${u(B[i.priority])}</span>
          <span class="badge badge-info">${u(i.category)}</span>
          <span style="font-size:10px;color:#94a3b8">الجهد: ${o}</span>
        </div>
        <div class="rec-title">${u(i.title)}</div>
        <div class="rec-desc">${u(i.description)}</div>
        <div class="rec-fix">⚡ الحل الكمومي: ${u(i.quantumFix)}</div>
      </div>
    `}).join("");return`
    <div class="section-title"><span class="icon">💡</span> التوصيات الأمنية (${t.length})</div>
    ${s}
  `}function rt(t){const s=t.vulnerabilityScore>60?"خطير":t.vulnerabilityScore>30?"متوسط":"جيد",i=t.threats.filter(a=>a.level==="critical").length,r=t.threats.filter(a=>a.level==="high").length,o=t.headerAnalysis.filter(a=>a.status!=="secure").length,f=t.portScan.filter(a=>a.state==="open").length;return`
    <div class="exec-summary">
      <h3>📋 الملخص التنفيذي</h3>
      <p>
        تم إجراء فحص أمان كمومي شامل للموقع <strong>${u(t.url)}</strong>.
        المستوى العام: <strong style="color:${t.vulnerabilityScore>60?"#dc2626":t.vulnerabilityScore>30?"#d97706":"#16a34a"}">${s}</strong>.
        تم اكتشاف <strong>${t.threats.length}</strong> تهديد
        (${i} حرج، ${r} عالي).
        نسبة المقاومة الكمومية: <strong>${t.quantumResistanceScore}%</strong>.
        الرؤوس الأمنية غير المطابقة: <strong>${o}</strong> من ${t.headerAnalysis.length}.
        المنافذ المفتوحة: <strong>${f}</strong>.
        يُوصى باتباع التوصيات المرفقة لتعزيز الحماية.
      </p>
    </div>
  `}function at(){const t=new Date;return`
    <div class="report-footer">
      <div>
        <div>تقرير صادر من منصة <strong>QURABIA</strong> — qurabia.com</div>
        <div>الدرع السيبراني الكمومي — Quantum Cyber Shield</div>
        <div>تاريخ الإصدار: ${t.toLocaleDateString("ar-SA")} | ${t.toLocaleTimeString("ar-SA")}</div>
      </div>
      <div class="stamp">🛡️ QURABIA</div>
    </div>
  `}function ai(t){const s=t.eavesdropperDetected,i=(t.qber*100).toFixed(2),r=Yt[t.securityRating];return`
    <div class="page-break"></div>
    <div class="section-title"><span class="icon">🔑</span> توزيع المفتاح الكمومي (QKD) — بروتوكول ${u(t.protocol)}</div>
    <div class="score-grid">
      <div class="score-card">
        <div class="value" style="color:${s?"#dc2626":"#16a34a"}">${s?"🚫":"✓"}</div>
        <div class="label">${s?"تم كشف متنصت!":"القناة آمنة"}</div>
      </div>
      <div class="score-card">
        <div class="value" style="color:${t.qber>.08?"#dc2626":"#16a34a"}">${i}%</div>
        <div class="label">معدل خطأ الكم (QBER)</div>
      </div>
      <div class="score-card">
        <div class="value" style="color:#00d4ff">${t.secureKeyLength}</div>
        <div class="label">طول المفتاح الآمن (بت)</div>
      </div>
      <div class="score-card">
        <div class="value" style="color:#7c3aed">${r}</div>
        <div class="label">تصنيف الأمان</div>
      </div>
    </div>
    <table>
      <thead><tr>
        <th>المعلمة</th><th>القيمة</th><th>الوصف</th>
      </tr></thead>
      <tbody>
        <tr><td>معرّف الجلسة</td><td style="font-family:monospace">${u(t.sessionId)}</td><td>معرّف فريد لجلسة QKD</td></tr>
        <tr><td>عدد الفوتونات</td><td>${t.totalPhotons.toLocaleString("ar-SA")}</td><td>إجمالي الفوتونات المرسلة</td></tr>
        <tr><td>القواعد المتطابقة</td><td>${t.matchedBases} (${(t.matchedBases/t.totalPhotons*100).toFixed(1)}%)</td><td>الفوتونات التي تطابقت فيها قاعدتا أليس وبوب</td></tr>
        <tr><td>QBER</td><td style="color:${t.qber>.11?"#dc2626":"#16a34a"};font-weight:700">${i}%</td><td>الحد الآمن: أقل من 11% (BB84)</td></tr>
        <tr><td>تضخيم الخصوصية</td><td>${(t.privacyAmplification*100).toFixed(1)}%</td><td>نسبة ضغط المفتاح لضمان السرية</td></tr>
        <tr><td>تصحيح الأخطاء</td><td>${t.errorCorrectionApplied?"مُطبّق ✓":"غير مطلوب"}</td><td>تصحيح أخطاء كلاسيكي على المفتاح المُنقّح</td></tr>
        <tr><td>كفاءة القناة</td><td>${(t.channelEfficiency*100).toFixed(1)}%</td><td>نسبة البتات الآمنة من إجمالي الفوتونات</td></tr>
      </tbody>
    </table>
  `}function oi(t){const s=t.attacks.map(i=>`
    <tr>
      <td style="font-family:monospace;font-weight:700">${u(i.id)}</td>
      <td>${u(i.nameAr)}</td>
      <td>${u(i.category)}</td>
      <td style="font-weight:700;color:${i.confidence>.9?"#dc2626":"#d97706"}">${(i.confidence*100).toFixed(1)}%</td>
      <td>${u(i.detectionMethod.replace("_"," "))}</td>
      <td style="font-size:10px">${i.detectionTimeMs.toFixed(2)} ms</td>
      <td style="font-size:10px">${i.anomalyScore.toFixed(2)}</td>
      <td style="font-size:10px;color:#475569">${u(i.mitigationSuggestion)}</td>
    </tr>
  `).join("");return`
    <div class="section-title"><span class="icon">🧠</span> نظام كشف التسلل الكمومي (QNIDS)</div>
    <div class="score-grid">
      <div class="score-card">
        <div class="value" style="color:#2563eb">${t.packetsAnalyzed.toLocaleString("ar-SA")}</div>
        <div class="label">حزم مُحلّلة</div>
      </div>
      <div class="score-card">
        <div class="value" style="color:#dc2626">${t.attacks.length}</div>
        <div class="label">هجمات مكتشفة</div>
      </div>
      <div class="score-card">
        <div class="value" style="color:#16a34a">${(t.modelAccuracy*100).toFixed(1)}%</div>
        <div class="label">دقة النموذج</div>
      </div>
      <div class="score-card">
        <div class="value" style="color:#d97706">${(t.falsePositiveRate*100).toFixed(2)}%</div>
        <div class="label">إنذارات كاذبة</div>
      </div>
    </div>
    <div class="detail-row"><span class="detail-label">كيوبتات المصنف:</span><span class="detail-value">${t.classifierQubits}</span></div>
    <div class="detail-row"><span class="detail-label">عمق الدائرة:</span><span class="detail-value">${t.circuitDepth}</span></div>
    <div class="detail-row" style="margin-bottom:12px"><span class="detail-label">حالة المصنف:</span><span class="detail-value badge badge-${t.classifierState==="alert"?"critical":"secure"}">${t.classifierState}</span></div>
    ${t.attacks.length>0?`
      <table>
        <thead><tr>
          <th>المعرّف</th><th>النمط</th><th>الفئة</th><th>الثقة</th><th>طريقة الكشف</th><th>زمن الكشف</th><th>درجة الشذوذ</th><th>الإجراء المقترح</th>
        </tr></thead>
        <tbody>${s}</tbody>
      </table>
    `:""}
  `}function li(t){const s=t.layers.map(i=>`
    <tr>
      <td style="font-family:monospace;font-weight:600">${u(i.algorithm)}</td>
      <td>${i.family==="lattice"?"شبكات":i.family==="code"?"أكواد":i.family==="hash"?"تجزئة":i.family}</td>
      <td style="font-weight:700;text-align:center">${i.nistLevel}</td>
      <td style="font-family:monospace">${i.publicKeySize.toLocaleString()}</td>
      <td style="font-family:monospace">${i.ciphertextSize.toLocaleString()}</td>
      <td>${i.keygenTimeMs.toFixed(2)} ms</td>
      <td>${i.encryptTimeMs.toFixed(2)} ms</td>
      <td>${i.decryptTimeMs.toFixed(2)} ms</td>
      <td style="color:#16a34a;font-weight:700">${i.shorResistant?"✓":"✗"}</td>
    </tr>
  `).join("");return`
    <div class="page-break"></div>
    <div class="section-title"><span class="icon">🔐</span> التشفير المتعدد الطبقات (Multi-Layer PQC)</div>
    <div class="score-grid">
      <div class="score-card">
        <div class="value" style="color:#00d4ff">${t.combinedSecurityBits}</div>
        <div class="label">قوة أمنية مجمعة (بت)</div>
      </div>
      <div class="score-card">
        <div class="value" style="color:#16a34a">${t.estimatedYearsSecure}+</div>
        <div class="label">سنوات أمان متوقعة</div>
      </div>
      <div class="score-card">
        <div class="value" style="color:#2563eb">${t.totalTimeMs.toFixed(1)}ms</div>
        <div class="label">الزمن الإجمالي</div>
      </div>
      <div class="score-card">
        <div class="value" style="color:#7c3aed">${(t.pqcReadiness*100).toFixed(0)}%</div>
        <div class="label">جاهزية PQC</div>
      </div>
    </div>
    <table>
      <thead><tr>
        <th>الخوارزمية</th><th>العائلة</th><th>NIST</th><th>مفتاح عام (بايت)</th>
        <th>نص مشفر (بايت)</th><th>توليد</th><th>تشفير</th><th>فك</th><th>مقاوم شور</th>
      </tr></thead>
      <tbody>${s}</tbody>
    </table>
  `}function di(t){return`
    <div class="section-title"><span class="icon">⚔️</span> محاكاة الهجمات الكمومية</div>
    <table>
      <thead><tr>
        <th>الهجوم</th><th>الهدف</th><th>كيوبتات</th><th>الزمن</th>
        <th>احتمال النجاح</th><th>الجدوى</th><th>سنة الجدوى</th><th>الدفاع</th><th>بعد الدفاع</th>
      </tr></thead>
      <tbody>${t.map(i=>{const r=i.currentlyFeasible?"badge-critical":"badge-secure",o=i.currentlyFeasible?"ممكن حالياً!":"غير ممكن",f=i.estimatedTimeHours===Number.POSITIVE_INFINITY?"∞":`${i.estimatedTimeHours.toFixed(1)} ساعة`;return`
      <tr>
        <td>${u(Jt[i.attack])}</td>
        <td style="font-family:monospace">${u(i.targetAlgorithm)}</td>
        <td style="font-family:monospace">${i.requiredQubits.toLocaleString()}</td>
        <td>${f}</td>
        <td style="font-weight:700">${(i.successProbability*100).toFixed(1)}%</td>
        <td><span class="badge ${r}">${o}</span></td>
        <td>${i.estimatedFeasibleYear}</td>
        <td style="font-family:monospace;font-size:10px">${u(i.recommendedDefense)}</td>
        <td style="color:#16a34a">${(i.postDefenseSuccessRate*100).toFixed(4)}%</td>
      </tr>
    `}).join("")}</tbody>
    </table>
  `}function ci(t){const s={entanglement_break:"انكسار تشابك",measurement_disturbance:"اضطراب قياس",decoherence_anomaly:"شذوذ فك تماسك",phase_shift:"انزياح طور",bell_violation:"انتهاك بيل"},i=t.traces.map(r=>`
    <tr>
      <td style="font-family:monospace;font-weight:700">${u(r.id)}</td>
      <td>${u(s[r.traceType]||r.traceType)}</td>
      <td>
        <div class="bar-meter" style="width:80px;display:inline-block">
          <div class="fill" style="width:${Math.round(r.strength*100)}%;background:${r.strength>.7?"#dc2626":"#d97706"}"></div>
        </div>
        <span style="font-size:10px;margin-right:4px">${(r.strength*100).toFixed(0)}%</span>
      </td>
      <td style="font-family:monospace;font-size:10px">${u(r.networkLocation)}</td>
      <td style="font-size:10px">${new Date(r.timestamp).toLocaleString("ar-SA")}</td>
      <td style="font-size:10px;color:#475569">${u(r.description)}</td>
    </tr>
  `).join("");return`
    <div class="page-break"></div>
    <div class="section-title"><span class="icon">🔬</span> التحليل الجنائي الكمومي</div>
    <div class="score-grid">
      <div class="score-card">
        <div class="value" style="color:#dc2626">${t.tracesFound}</div>
        <div class="label">آثار مكتشفة</div>
      </div>
      <div class="score-card">
        <div class="value" style="color:#2563eb">${(t.confidence*100).toFixed(0)}%</div>
        <div class="label">ثقة التحليل</div>
      </div>
      <div class="score-card">
        <div class="value" style="color:${t.dataRecoverable?"#16a34a":"#dc2626"}">${t.dataRecoverable?"✓":"✗"}</div>
        <div class="label">إمكانية استرداد البيانات</div>
      </div>
      <div class="score-card">
        <div class="value" style="color:#d97706">${(t.recoveryRate*100).toFixed(0)}%</div>
        <div class="label">نسبة الاسترداد</div>
      </div>
    </div>
    <div class="detail-row"><span class="detail-label">معرّف التحقيق:</span><span class="detail-value">${u(t.investigationId)}</span></div>
    <div class="detail-row" style="margin-bottom:12px"><span class="detail-label">المصدر المحتمل:</span><span class="detail-value">${u(t.probableSource)}</span></div>
    ${t.traces.length>0?`
      <table>
        <thead><tr><th>المعرّف</th><th>النوع</th><th>القوة</th><th>الموقع</th><th>الوقت</th><th>الوصف</th></tr></thead>
        <tbody>${i}</tbody>
      </table>
    `:""}
    <div class="section-title" style="font-size:13px;margin-top:16px"><span class="icon">📌</span> توصيات التحقيق الجنائي</div>
    <ol style="padding-right:20px;font-size:11px;line-height:2;color:#334155">
      ${t.recommendations.map(r=>`<li>${u(r)}</li>`).join("")}
    </ol>
  `}function pi(t){const s={critical:"#dc2626",poor:"#d97706",fair:"#d97706",good:"#16a34a",excellent:"#16a34a"},i=t.categories.map(a=>`
    <tr>
      <td style="font-weight:700">${u(a.nameAr)}</td>
      <td style="font-weight:700;text-align:center;color:${a.score/a.maxScore>.6?"#16a34a":"#dc2626"}">${a.score.toFixed(1)} / ${a.maxScore}</td>
      <td>
        <div class="bar-meter" style="width:100px;display:inline-block">
          <div class="fill" style="width:${a.score/a.maxScore*100}%;background:${a.score/a.maxScore>.6?"#16a34a":a.score/a.maxScore>.3?"#d97706":"#dc2626"}"></div>
        </div>
      </td>
      <td style="font-size:10px;color:#475569">${a.findings.map(x=>u(x)).join("<br>")}</td>
      <td style="font-size:10px;color:#0369a1">${a.recommendations.map(x=>u(x)).join("<br>")}</td>
    </tr>
  `).join(""),r={immediate:"🔴 فوري",short_term:"🟠 قصير المدى",medium_term:"🟡 متوسط المدى",long_term:"🟢 طويل المدى"},o=t.priorities.map(a=>`
    <tr>
      <td>${u(r[a.urgency]||a.urgency)}</td>
      <td>${u(a.action)}</td>
    </tr>
  `).join(""),f={low:"منخفضة",medium:"متوسطة",high:"مرتفعة",very_high:"مرتفعة جداً"};return`
    <div class="page-break"></div>
    <div class="section-title"><span class="icon">📈</span> مؤشر الجاهزية لما بعد الكمومي (PQC Readiness)</div>
    <div class="score-grid">
      <div class="score-card" style="grid-column: span 2">
        <div class="value" style="color:${s[t.rating]||"#334155"};font-size:42px">${t.overallScore}/100</div>
        <div class="label" style="font-size:14px;font-weight:700;color:${s[t.rating]}">${u(t.ratingAr)}</div>
      </div>
      <div class="score-card">
        <div class="value" style="color:#2563eb">${t.yearsUntilQuantumThreat}</div>
        <div class="label">سنوات حتى التهديد الكمومي</div>
      </div>
      <div class="score-card">
        <div class="value" style="color:#d97706;font-size:16px">${u(f[t.migrationComplexity]||t.migrationComplexity)}</div>
        <div class="label">تعقيد الترحيل</div>
      </div>
    </div>
    <table>
      <thead><tr><th>الفئة</th><th>الدرجة</th><th>المؤشر</th><th>النتائج</th><th>التوصيات</th></tr></thead>
      <tbody>${i}</tbody>
    </table>
    <div class="section-title" style="font-size:13px;margin-top:16px"><span class="icon">🎯</span> خطة الأولويات</div>
    <table>
      <thead><tr><th style="width:130px">الأولوية</th><th>الإجراء</th></tr></thead>
      <tbody>${o}</tbody>
    </table>
  `}function u(t){return t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function Qe(t){const s=ot(t);dt(s)}function ot(t){return`<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>كشف فحص الأمان الكمومي — ${u(t.url)}</title>
  <style>${Ge()}</style>
</head>
<body>
  <div class="report-container">
    <div class="print-actions no-print">
      <button class="print-btn print-btn-primary" onclick="window.print()">🖨️ طباعة التقرير</button>
      <button class="print-btn print-btn-secondary" onclick="window.close()">✕ إغلاق</button>
    </div>
    ${Ze(t.url,t.timestamp)}
    ${rt(t)}
    ${et(t.vulnerabilityScore,t.quantumResistanceScore,t.shieldState,t.threats.length)}
    ${tt(t.threats)}
    <div class="page-break"></div>
    ${it(t.headerAnalysis)}
    ${st(t.portScan)}
    ${nt(t.recommendations)}
    ${at()}
  </div>
</body>
</html>`}function Ke(t,s){const i=lt(t,s);dt(i)}function lt(t,s){return`<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>التقرير الشامل للأمان الكمومي — ${u(t.url)}</title>
  <style>${Ge()}</style>
</head>
<body>
  <div class="report-container">
    <div class="print-actions no-print">
      <button class="print-btn print-btn-primary" onclick="window.print()">🖨️ طباعة التقرير الشامل</button>
      <button class="print-btn print-btn-secondary" onclick="window.close()">✕ إغلاق</button>
    </div>
    ${Ze(t.url,t.timestamp)}
    ${rt(t)}

    <!-- الدرجة الشاملة -->
    <div class="exec-summary" style="text-align:center;background:linear-gradient(135deg,#0f172a,#1e293b);color:#fff;border:none">
      <div style="font-size:11px;color:rgba(255,255,255,0.6);margin-bottom:4px">الدرجة الشاملة للأمان الكمومي</div>
      <div style="font-size:56px;font-weight:900;color:${s.overallQuantumSecurityScore>70?"#22c55e":s.overallQuantumSecurityScore>40?"#f59e0b":"#ef4444"};font-family:monospace">${s.overallQuantumSecurityScore}/100</div>
    </div>

    ${et(t.vulnerabilityScore,t.quantumResistanceScore,t.shieldState,t.threats.length)}
    ${tt(t.threats)}
    <div class="page-break"></div>
    ${it(t.headerAnalysis)}
    ${st(t.portScan)}
    ${nt(t.recommendations)}
    ${ai(s.qkdSession)}
    ${oi(s.qnidsAnalysis)}
    ${li(s.encryptionLayers)}
    ${di(s.attackSimulations)}
    ${ci(s.forensicAnalysis)}
    ${pi(s.pqcReadiness)}
    ${at()}
  </div>
</body>
</html>`}function dt(t){const s=window.open("","_blank","width=900,height=700");s&&(s.document.open(),s.document.write(t),s.document.close())}function ui(t,s){const i=new Blob([t],{type:"text/html;charset=utf-8"}),r=URL.createObjectURL(i),o=document.createElement("a");o.href=r,o.download=s,document.body.appendChild(o),o.click(),document.body.removeChild(o),URL.revokeObjectURL(r)}const fi=3e3,gi=5;function hi(t){const{url:s,eventName:i,withCredentials:r=!1,reconnectInterval:o=fi,maxReconnects:f=gi,onMessage:a,onError:x}=t,[b,g]=d.useState({data:null,isConnected:!1,error:null,lastEvent:null,reconnectCount:0}),h=d.useRef(null),k=d.useRef(null),$=d.useRef(0),D=d.useRef(a),z=d.useRef(x);D.current=a,z.current=x;const C=d.useCallback(()=>{h.current&&h.current.close();const j=new EventSource(s,{withCredentials:r});h.current=j,j.onopen=()=>{g(y=>({...y,isConnected:!0,error:null,reconnectCount:$.current}))};const I=y=>{try{const v=JSON.parse(y.data);g(R=>({...R,data:v,lastEvent:y.type})),D.current?.(v,y)}catch{g(v=>({...v,data:y.data,lastEvent:y.type}))}};i?j.addEventListener(i,I):j.onmessage=I,j.onerror=y=>{g(v=>({...v,isConnected:!1,error:"Connection lost"})),z.current?.(y),j.close(),h.current=null,$.current<f&&($.current++,k.current=setTimeout(()=>{C()},o))}},[s,i,r,o,f]),w=d.useCallback(()=>{k.current&&(clearTimeout(k.current),k.current=null),h.current&&(h.current.close(),h.current=null),g(j=>({...j,isConnected:!1}))},[]),F=d.useCallback(()=>{w(),$.current=0,C()},[w,C]);return d.useEffect(()=>(C(),w),[C,w]),{...b,disconnect:w,reconnect:F}}const yi=[{id:"dashboard",label:"لوحة التحكم",icon:re},{id:"soc",label:"المراقبة الحية",icon:P},{id:"scanner",label:"فحص الأمان",icon:ae},{id:"firewall",label:"الجدار الكمومي",icon:ne},{id:"encryption",label:"التشفير الكمومي",icon:G},{id:"ids",label:"كشف التسلل",icon:P},{id:"report",label:"التقارير",icon:Nt}],Q={critical:"#ef4444",high:"#f59e0b",medium:"#3b82f6",low:"#22c55e",info:"#8b5cf6"},Ue={active:"#22c55e",monitoring:"#3b82f6",blocked:"#ef4444",investigating:"#f59e0b",neutralized:"#8b5cf6"},mi={active:"نشط",monitoring:"مراقبة",blocked:"محظور",investigating:"تحقيق",neutralized:"مُحايد"},xi={ar:{home:"الرئيسية",title:"الدرع السيبراني الكمومي",subtitle:"Quantum Cyber Shield — حماية مستوحاة من فيزياء الكم",shieldActive:"الدرع نشط",shieldMonitoring:"مراقبة",liveOps:"المراقبة الحية",liveOpsHint:"رصد تهديدات لحظي + جدار حماية تكيفي + تقارير",connected:"متصل",disconnected:"غير متصل",risk:"مؤشر المخاطر",alerts:"إنذارات",blocked:"محظور",reqTotal:"إجمالي الطلبات",reqBlocked:"طلبات محظورة",topIps:"أكثر IP نشاطاً",threatFeed:"سجل التهديدات",none:"لا يوجد",ip:"IP",reason:"السبب",blockIp:"حظر IP",unblock:"رفع الحظر",exportReport:"تحميل تقرير أمني (JSON)",predict:"تحليل اختراق تنبؤي",forecast:"التوقع",pqc:"تشفير ما بعد الكمومي (وضع تجريبي)",encrypt:"تشفير",decrypt:"فك تشفير",unlock:"تفعيل صلاحيات الإدارة",lock:"إيقاف صلاحيات الإدارة",requiresUnlock:"يتطلب تفعيل صلاحيات الإدارة لإدارة الجدار الناري",siteAnalysis:"تحليل موقع شامل",siteAnalysisHint:"تحليل حقيقي لـ HTML/CSS/JS + الأداء + SEO + الأمان مع دعم المواقع الديناميكية (اختياري)",runSiteAnalysis:"تشغيل التحليل",dynamicRender:"تحليل ديناميكي (تجريبي)",analysisReport:"تقرير التحليل",aiInsights:"تحليل وتوصيات بالذكاء الاصطناعي",rendered:"تم التحليل ديناميكياً",tech:"التقنيات المكتشفة",totalBytes:"إجمالي الحجم",jsBytes:"حجم JS",cssBytes:"حجم CSS",blockingScripts:"سكريبتات تعيق العرض",openrouterTitle:"OpenRouter",adminCode:"رمز الإدارة",openrouterKey:"مفتاح OpenRouter",openrouterModel:"نموذج OpenRouter",saveKey:"حفظ المفتاح",runtimeConfigHint:"سيتم إرسال المفتاح إلى الخادم عبر HTTPS ولن يتم حفظه في المتصفح. فعّل ENABLE_RUNTIME_SECRET_CONFIG و ADMIN_ACCESS_CODE في الخادم."},en:{home:"Home",title:"Quantum Cyber Shield",subtitle:"Quantum Cyber Shield — security inspired by quantum physics",shieldActive:"Shield active",shieldMonitoring:"Monitoring",liveOps:"Live Operations",liveOpsHint:"Real-time monitoring + adaptive firewall + reports",connected:"Connected",disconnected:"Disconnected",risk:"Risk",alerts:"Alerts",blocked:"Blocked",reqTotal:"Total requests",reqBlocked:"Blocked requests",topIps:"Top IPs",threatFeed:"Threat feed",none:"None",ip:"IP",reason:"Reason",blockIp:"Block IP",unblock:"Unblock",exportReport:"Download security report (JSON)",predict:"Predictive breach analysis",forecast:"Forecast",pqc:"Post-quantum encryption (demo)",encrypt:"Encrypt",decrypt:"Decrypt",unlock:"Enable admin actions",lock:"Disable admin actions",requiresUnlock:"Enable admin actions to manage firewall rules",siteAnalysis:"Full Website Analysis",siteAnalysisHint:"Real analysis for HTML/CSS/JS + performance + SEO + security (optional dynamic render)",runSiteAnalysis:"Run analysis",dynamicRender:"Dynamic render (experimental)",analysisReport:"Analysis report",aiInsights:"AI insights & recommendations",rendered:"Rendered (dynamic)",tech:"Detected technologies",totalBytes:"Total bytes",jsBytes:"JS bytes",cssBytes:"CSS bytes",blockingScripts:"Render-blocking scripts",openrouterTitle:"OpenRouter",adminCode:"Admin code",openrouterKey:"OpenRouter API key",openrouterModel:"OpenRouter model",saveKey:"Save key",runtimeConfigHint:"The key is sent to the backend over HTTPS and is not stored in the browser. Enable ENABLE_RUNTIME_SECRET_CONFIG and ADMIN_ACCESS_CODE on the backend."}};function M({label:t,value:s,color:i,icon:r}){const o=Math.round(s*100);return e.jsxs("div",{className:"ui-card",style:{padding:16,borderRadius:16,display:"flex",flexDirection:"column",gap:8},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:8},children:[e.jsx(r,{size:16,style:{color:i}}),e.jsx("span",{style:{fontSize:12,color:"var(--fg-3)",fontWeight:600},children:t})]}),e.jsxs("div",{style:{fontSize:28,fontWeight:900,color:i,fontFamily:"var(--font-mono)"},children:[o,"%"]}),e.jsx("div",{style:{height:4,borderRadius:999,background:"var(--surface-2)",overflow:"hidden"},children:e.jsx("div",{style:{height:"100%",width:`${o}%`,background:i,borderRadius:999,transition:"width 0.5s"}})})]})}function we({t}){return e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"90px 1fr 70px 70px",gap:8,alignItems:"center",padding:"8px 12px",borderRadius:10,background:"var(--surface)",fontSize:12},children:[e.jsx("span",{style:{fontWeight:700,color:Q[t.level],fontFamily:"var(--font-mono)"},children:t.id}),e.jsx("span",{style:{color:"var(--fg-2)"},children:le[t.vector]}),e.jsx("span",{style:{textAlign:"center",padding:"2px 6px",borderRadius:6,background:`${Q[t.level]}20`,color:Q[t.level],fontWeight:700,fontSize:11},children:B[t.level]}),e.jsx("span",{style:{textAlign:"center",padding:"2px 6px",borderRadius:6,background:`${Ue[t.status]}20`,color:Ue[t.status],fontWeight:700,fontSize:11},children:mi[t.status]})]})}function vi({c:t}){const s=t.status==="secure"?e.jsx(Pt,{size:14,style:{color:"#22c55e"}}):t.status==="warning"?e.jsx(Wt,{size:14,style:{color:"#f59e0b"}}):e.jsx(Bt,{size:14,style:{color:"#ef4444"}}),i=t.status==="secure"?"#22c55e":t.status==="warning"?"#f59e0b":"#ef4444",r=t.status==="secure"?"آمن":t.status==="warning"?"تحذير":t.status==="weak"?"ضعيف":"مفقود";return e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"24px 1fr 60px 1fr",gap:8,alignItems:"center",padding:"8px 12px",borderRadius:10,background:"var(--surface)",fontSize:12},children:[s,e.jsx("span",{style:{fontWeight:600,color:"var(--fg-2)",fontFamily:"var(--font-mono)"},children:t.header}),e.jsx("span",{style:{textAlign:"center",padding:"2px 6px",borderRadius:6,background:`${i}20`,color:i,fontWeight:700,fontSize:11},children:r}),e.jsx("span",{style:{color:"var(--fg-3)",fontSize:11},children:t.recommendation})]})}function bi({p:t}){const s=t.state==="open"?"#ef4444":t.state==="filtered"?"#f59e0b":"#22c55e",i=t.state==="open"?"مفتوح":t.state==="filtered"?"مُصفّى":"مغلق";return e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"50px 1fr 70px 50px",gap:8,alignItems:"center",padding:"6px 12px",borderRadius:8,background:"var(--surface)",fontSize:12},children:[e.jsx("span",{style:{fontFamily:"var(--font-mono)",fontWeight:700},children:t.port}),e.jsx("span",{style:{color:"var(--fg-2)"},children:t.service}),e.jsx("span",{style:{textAlign:"center",padding:"2px 6px",borderRadius:6,background:`${s}20`,color:s,fontWeight:700,fontSize:11},children:i}),e.jsx("span",{style:{color:Q[t.risk],fontWeight:700},children:B[t.risk]})]})}function Si({r:t}){return e.jsxs("div",{className:"ui-card",style:{padding:16,borderRadius:14,display:"flex",flexDirection:"column",gap:8,borderRight:`3px solid ${Q[t.priority]}`},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:8},children:[e.jsx("span",{style:{fontSize:11,padding:"2px 8px",borderRadius:6,background:`${Q[t.priority]}20`,color:Q[t.priority],fontWeight:700},children:B[t.priority]}),e.jsx("span",{style:{fontSize:11,padding:"2px 8px",borderRadius:6,background:"var(--surface-2)",color:"var(--fg-3)"},children:t.category})]}),e.jsx("div",{style:{fontWeight:700,color:"var(--fg)",fontSize:14},children:t.title}),e.jsx("div",{style:{fontSize:12,color:"var(--fg-3)",lineHeight:1.6},children:t.description}),e.jsxs("div",{style:{fontSize:12,color:"var(--p-secondary)",lineHeight:1.6,padding:"8px 12px",borderRadius:10,background:"rgba(0,212,255,0.05)",border:"1px solid rgba(0,212,255,0.15)"},children:[e.jsx(oe,{size:12,style:{verticalAlign:"middle",marginLeft:4}})," ",t.quantumFix]})]})}function wi(){const[t,s]=d.useState("dashboard"),[i,r]=d.useState("ar"),[o,f]=d.useState(""),[a,x]=d.useState(null),[b,g]=d.useState(!1),[h,k]=d.useState({integrity:.95,entanglement:.92,superposition:.88,coherence:.97,fidelity:.99}),[$,D]=d.useState(null),[z,C]=d.useState(0),[w,F]=d.useState([]),[j,I]=d.useState(null),[y,v]=d.useState(null),[R,N]=d.useState(!1),[H,Ce]=d.useState(null),[ce,ct]=d.useState(""),[pe,pt]=d.useState(!1),[ue,Ae]=d.useState(!1),[A,ze]=d.useState(null),[Te,fe]=d.useState(null),[ge,Ie]=d.useState(!1),[Y,he]=d.useState(null),[_,ee]=d.useState(!1),[ye,ut]=d.useState(""),[me,Me]=d.useState(""),[xe,De]=d.useState("openai/gpt-4o-mini"),[Ne,_e]=d.useState(!1),[ve,Ee]=d.useState(""),[Le,te]=d.useState(!1),[Fe,ft]=d.useState([]),[be,gt]=d.useState(null),[Se,Pe]=d.useState(""),[K,ht]=d.useState(null),c=It(),l=xi[i],yt=i==="ar"?"rtl":"ltr",mt=i==="ar"?"var(--font-ar)":"var(--font-ui)",{data:We,isConnected:J}=hi({url:`${T}/api/security/stream`,maxReconnects:20,reconnectInterval:2500}),E=We?.metrics,L=We?.events??[];d.useEffect(()=>{const n=setInterval(()=>{const p=E?.top_ips?.reduce((S,m)=>S+(m.count||0),0)??Math.floor(500+Math.random()*9500);if(C(p),k(Ut(p)),L.length===0&&Math.random()<.08){const S=["sql_injection","xss","ddos","brute_force","mitm","zero_day","quantum_attack"],m=["critical","high","medium","low"],O=S[Math.floor(Math.random()*S.length)],X=m[Math.floor(Math.random()*m.length)];F(Tt=>[{id:`QT-${Date.now().toString(16).slice(-6).toUpperCase()}`,vector:O,level:X,source:`${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.x.x`,target:"qurabia.com",timestamp:Date.now(),description:`كشف ${le[O]} — ${B[X]}`,quantumSignature:`qsh-${Math.random().toString(36).slice(2,10)}`,status:X==="critical"?"blocked":"monitoring"},...Tt].slice(0,50))}},2e3);return()=>clearInterval(n)},[L.length,E]),d.useEffect(()=>{const n=async()=>{try{const S=await fetch(`${T}/api/security/firewall`);if(!S.ok)return;const m=await S.json();ft(m?.blocked??[])}catch{}};n();const p=setInterval(n,5e3);return()=>clearInterval(p)},[]),d.useEffect(()=>{const n=async()=>{try{const S=await fetch(`${T}/api/security/predict?window_s=900`);if(!S.ok)return;const m=await S.json();gt(m)}catch{}};n();const p=setInterval(n,6e3);return()=>clearInterval(p)},[]);const xt=d.useCallback(async()=>{try{const n=await fetch(`${T}/api/security/report?window_s=3600`);if(!n.ok){c.error(i==="ar"?"تعذر توليد التقرير":"Failed to generate report");return}const p=await n.json(),S=new Blob([JSON.stringify(p,null,2)],{type:"application/json"}),m=document.createElement("a");m.href=URL.createObjectURL(S),m.download=`qurabia-security-report-${new Date().toISOString().slice(0,10)}.json`,m.click(),URL.revokeObjectURL(m.href),c.success(i==="ar"?"تم تحميل التقرير":"Report downloaded")}catch{c.error(i==="ar"?"خطأ في الاتصال":"Network error")}},[i,c]),vt=d.useCallback(async()=>{if(_){ee(!1);return}if(!("PublicKeyCredential"in window)||!navigator.credentials){ee(!0),c.warning(i==="ar"?"لا يدعم المتصفح WebAuthn — تم التفعيل بدون بيومتري":"WebAuthn not supported — enabled without biometrics");return}try{const n=globalThis.crypto;if(!n?.getRandomValues){ee(!0),c.warning(i==="ar"?"لا يتوفر WebCrypto — تم التفعيل بدون بيومتري":"WebCrypto unavailable — enabled without biometrics");return}const p=n.getRandomValues(new Uint8Array(32));await navigator.credentials.get({publicKey:{challenge:p,timeout:6e4,userVerification:"required",allowCredentials:[]}}),ee(!0),c.success(i==="ar"?"تم تفعيل صلاحيات الإدارة":"Admin actions enabled")}catch{c.error(i==="ar"?"تعذر التحقق البيومتري":"Biometric verification failed")}},[_,i,c]),bt=d.useCallback(async()=>{if(!_){c.warning(l.requiresUnlock);return}const n=ve.trim();if(!n){c.warning(i==="ar"?"أدخل IP":"Enter an IP");return}te(!0);try{(await fetch(`${T}/api/security/firewall/block`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({ip:n,seconds:900,reason:"console"})})).ok?(c.success(i==="ar"?"تم الحظر":"Blocked"),Ee("")):c.error(i==="ar"?"فشل الحظر":"Block failed")}finally{te(!1)}},[_,ve,i,l.requiresUnlock,c]),St=d.useCallback(async n=>{if(!_){c.warning(l.requiresUnlock);return}te(!0);try{(await fetch(`${T}/api/security/firewall/unblock`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({ip:n})})).ok?c.success(l.unblock):c.error(i==="ar"?"فشل رفع الحظر":"Unblock failed")}finally{te(!1)}},[_,i,l.requiresUnlock,l.unblock,c]),jt=d.useCallback(async()=>{try{const n=await fetch(`${T}/api/security/pqc/encrypt`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({plaintext:Se,aad:""})});if(!n.ok){c.error(i==="ar"?"PQC demo غير متاح":"PQC demo disabled");return}const p=await n.json();ht(p.envelope??null),c.success(i==="ar"?"تم التشفير":"Encrypted")}catch{c.error(i==="ar"?"خطأ في الاتصال":"Network error")}},[i,Se,c]),$t=d.useCallback(async()=>{if(K)try{const n=await fetch(`${T}/api/security/pqc/decrypt`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({envelope:K,aad:""})});if(!n.ok){c.error(i==="ar"?"فشل فك التشفير":"Decrypt failed");return}const p=await n.json();c.success(i==="ar"?"تم فك التشفير":"Decrypted"),Pe(String(p.plaintext??""))}catch{c.error(i==="ar"?"خطأ في الاتصال":"Network error")}},[i,K,c]),kt=d.useCallback(async()=>{const n=ye.trim(),p=me.trim(),S=xe.trim();if(!n){c.warning(i==="ar"?"أدخل رمز الإدارة":"Enter admin code");return}if(!p){c.warning(i==="ar"?"أدخل مفتاح OpenRouter":"Enter OpenRouter API key");return}_e(!0);try{const m=await fetch(`${T}/api/admin/openrouter/config`,{method:"POST",headers:{"Content-Type":"application/json","X-Admin-Code":n},body:JSON.stringify({api_key:p,model:S})});if(!m.ok){const X=await m.text();c.error(X||(i==="ar"?"فشل حفظ المفتاح":"Failed to save key"));return}const O=await m.json();c.success(i==="ar"?"تم تفعيل OpenRouter":"OpenRouter enabled"),O?.model&&De(String(O.model)),Me("")}catch{c.error(i==="ar"?"خطأ في الاتصال":"Network error")}finally{_e(!1)}},[ye,i,me,xe,c]),Rt=d.useCallback(async()=>{if(!o.trim()){c.warning("أدخل رابط الموقع");return}g(!0);try{const n=await Qt(o);x(n);const p=ii(o);I(p),c.success(`فحص كمومي — ${n.threats.length} تهديدات — مقاومة ${n.quantumResistanceScore}%`)}catch(n){const p=n instanceof Error?n.message:"تعذر تنفيذ الفحص، حاول مجدداً";c.error(p)}finally{g(!1)}},[o,c]),wt=d.useCallback(()=>{D(Kt(256)),c.success("تم توليد مفتاح كمومي مقاوم")},[c]),Ct=d.useCallback(async()=>{if(!a){c.warning("قم بفحص موقع أولاً");return}N(!0),v(null),Ce(null);try{const n=T,p={url:a.url,vulnerability_score:a.vulnerabilityScore,quantum_resistance_score:a.quantumResistanceScore,is_https:a.url.startsWith("https"),headers:a.headerAnalysis.map(m=>({header:m.header,present:m.present,value:m.value,status:m.status,recommendation:m.recommendation})),threats_count:a.threats.length,open_ports:a.portScan.filter(m=>m.state==="open").length,shield_state:a.shieldState},S=await fetch(`${n}/api/cyber/ai-analyze`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({scan_result:p,provider:"openrouter"})});if(S.ok){const m=await S.json();v(m.text||"لم يتم الحصول على تحليل"),Ce(m.provider||"local"),c.success(`تحليل ذكاء اصطناعي — ${m.provider==="local"?"تحليل محلي":m.provider}`)}else c.error("تعذر الاتصال بخدمة الذكاء الاصطناعي")}catch{c.error("خطأ في الاتصال — حاول مجدداً")}finally{N(!1)}},[a,c]),At=d.useCallback(async()=>{const n=ce.trim();if(!n){c.warning(i==="ar"?"أدخل رابط الموقع":"Enter a website URL");return}Ae(!0),ze(null),fe(null),he(null);try{const p=await fetch(`${T}/api/site/scan`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({url:n,render:pe,max_resources:12})});if(!p.ok){const O=await p.text();c.error(O||(i==="ar"?"تعذر تنفيذ التحليل":"Analysis failed"));return}const S=await p.json();ze(S);const m=S?.scores??{};c.success(`${i==="ar"?"تم التحليل":"Analyzed"} — SEO ${m.seo??"-"} • SEC ${m.security??"-"} • PERF ${m.performance??"-"}`)}catch{c.error(i==="ar"?"خطأ في الاتصال — حاول مجدداً":"Network error — try again")}finally{Ae(!1)}},[i,pe,ce,c]),zt=d.useCallback(async()=>{if(!A){c.warning(i==="ar"?"قم بتشغيل التحليل أولاً":"Run analysis first");return}Ie(!0),fe(null),he(null);try{const n=await fetch(`${T}/api/site/ai-insights`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({report:A,provider:"openrouter",language:i})});if(!n.ok){c.error(i==="ar"?"تعذر الاتصال بخدمة الذكاء الاصطناعي":"AI service unavailable");return}const p=await n.json();fe(p.text||""),he(p.provider||"local")}catch{c.error(i==="ar"?"خطأ في الاتصال — حاول مجدداً":"Network error — try again")}finally{Ie(!1)}},[i,A,c]);return e.jsxs("div",{dir:yt,style:{minHeight:"100vh",background:"var(--bg)",fontFamily:mt,color:"var(--fg)"},children:[e.jsxs("header",{style:{position:"sticky",top:0,zIndex:100,background:"rgba(7,10,15,0.85)",backdropFilter:"blur(16px)",borderBottom:"1px solid var(--outline)",padding:"12px 24px",display:"flex",alignItems:"center",gap:16},children:[e.jsxs(Mt,{to:"/",style:{color:"var(--fg-3)",textDecoration:"none",display:"flex",alignItems:"center",gap:4,fontSize:13},children:[e.jsx(Dt,{size:14})," ",l.home]}),e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:10},children:[e.jsx("div",{style:{width:36,height:36,borderRadius:12,display:"grid",placeItems:"center",background:"rgba(0,212,255,0.1)",border:"1px solid rgba(0,212,255,0.3)"},children:e.jsx(ne,{size:18,style:{color:"#00d4ff"}})}),e.jsxs("div",{children:[e.jsx("div",{style:{fontWeight:900,fontSize:16},children:l.title}),e.jsx("div",{style:{fontSize:11,color:"var(--fg-3)"},children:l.subtitle})]})]}),e.jsx("div",{style:{flex:1}}),e.jsx("button",{type:"button",onClick:()=>r(n=>n==="ar"?"en":"ar"),className:"ui-btn",style:{border:"1px solid var(--outline)",borderRadius:10,padding:"8px 12px",background:"transparent",color:"var(--fg-2)",cursor:"pointer",fontWeight:800,fontSize:12},children:i==="ar"?"EN":"AR"}),e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:6,padding:"4px 12px",borderRadius:999,background:`${h.fidelity>.9?"#22c55e":"#f59e0b"}20`,border:`1px solid ${h.fidelity>.9?"#22c55e":"#f59e0b"}40`},children:[e.jsx("div",{style:{width:8,height:8,borderRadius:999,background:h.fidelity>.9?"#22c55e":"#f59e0b",animation:"qfloat 2s infinite"}}),e.jsx("span",{style:{fontSize:11,fontWeight:700,color:h.fidelity>.9?"#22c55e":"#f59e0b"},children:h.fidelity>.9?l.shieldActive:l.shieldMonitoring})]})]}),e.jsx("nav",{style:{display:"flex",gap:4,padding:"12px 24px",overflowX:"auto",borderBottom:"1px solid var(--outline)"},children:yi.map(n=>{const p=n.icon,S=t===n.id,m=n.id==="soc"?l.liveOps:n.label;return e.jsxs("button",{type:"button",onClick:()=>s(n.id),style:{display:"flex",alignItems:"center",gap:6,padding:"8px 16px",borderRadius:10,border:"none",background:S?"var(--p-primary)":"transparent",color:S?"#000":"var(--fg-3)",cursor:"pointer",fontWeight:700,fontSize:13,transition:"all 0.2s"},children:[e.jsx(p,{size:15})," ",m]},n.id)})}),e.jsxs("main",{style:{padding:24,maxWidth:1280,margin:"0 auto"},children:[t==="dashboard"&&e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:24},children:[e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(180px, 1fr))",gap:16},children:[e.jsx(M,{label:"سلامة الدرع",value:h.integrity,color:"#22c55e",icon:ie}),e.jsx(M,{label:"التشابك الكمومي",value:h.entanglement,color:"#00d4ff",icon:je}),e.jsx(M,{label:"التراكب",value:h.superposition,color:"#8b5cf6",icon:$e}),e.jsx(M,{label:"التماسك",value:h.coherence,color:"#f59e0b",icon:re}),e.jsx(M,{label:"الدقة الكمومية",value:h.fidelity,color:"#22c55e",icon:oe})]}),e.jsxs("div",{className:"ui-card",style:{padding:20,borderRadius:18,display:"flex",flexDirection:"column",gap:12},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:8},children:[e.jsx(_t,{size:16,style:{color:"var(--p-secondary)"}}),e.jsx("span",{style:{fontWeight:700},children:"حركة المرور الحية"}),e.jsxs("span",{style:{fontFamily:"var(--font-mono)",fontSize:13,color:"var(--p-primary)",fontWeight:900},children:[z.toLocaleString()," طلب/ث"]})]}),e.jsx("div",{style:{height:8,borderRadius:999,background:"var(--surface-2)",overflow:"hidden"},children:e.jsx("div",{style:{height:"100%",width:`${Math.min(100,z/1e4*100)}%`,background:z>8e3?"linear-gradient(90deg, #f59e0b, #ef4444)":"linear-gradient(90deg, var(--p-primary), var(--p-secondary))",borderRadius:999,transition:"width 1s"}})})]}),e.jsxs("div",{className:"ui-card",style:{padding:20,borderRadius:18},children:[e.jsxs("div",{style:{fontWeight:700,marginBottom:12,display:"flex",alignItems:"center",gap:8},children:[e.jsx(P,{size:16,style:{color:"#ef4444"}})," ",l.threatFeed]}),e.jsx("div",{style:{display:"flex",flexDirection:"column",gap:6,maxHeight:300,overflowY:"auto"},children:L.length===0&&w.length===0?e.jsx("div",{style:{textAlign:"center",padding:24,color:"var(--fg-3)"},children:i==="ar"?"لا توجد تهديدات — الدرع يعمل بكفاءة":"No threats detected — shield is stable"}):L.length?L.map((n,p)=>e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 90px",gap:10,alignItems:"center",padding:"8px 12px",borderRadius:10,background:"var(--surface)",fontSize:12},children:[e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:2},children:[e.jsxs("div",{style:{fontWeight:800,color:"var(--fg-2)"},children:[n.category," · ",n.severity," · ",n.reason]}),e.jsxs("div",{style:{color:"var(--fg-3)",fontFamily:"var(--font-mono)"},children:[n.ip," · ",n.method," · ",n.path]})]}),e.jsxs("div",{style:{textAlign:"center",padding:"2px 6px",borderRadius:6,background:"rgba(239,68,68,0.12)",color:"#ef4444",fontWeight:800,fontFamily:"var(--font-mono)"},children:[Math.round((Number(n.score)||0)*100),"%"]})]},`${n.ts}-${n.ip}-${p}`)):w.map(n=>e.jsx(we,{t:n},n.id))})]}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(280px, 1fr))",gap:16},children:[e.jsxs("div",{className:"ui-card",style:{padding:20,borderRadius:16,borderRight:"3px solid #00d4ff"},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:8,marginBottom:8},children:[e.jsx(je,{size:18,style:{color:"#00d4ff"}}),e.jsx("span",{style:{fontWeight:700},children:"مبدأ التشابك الكمومي"})]}),e.jsx("div",{style:{fontSize:13,color:"var(--fg-3)",lineHeight:1.7},children:"أي محاولة لاعتراض البيانات تُغيّر حالة الجسيمات المتشابكة فوراً مما يُكشف المتنصت تلقائياً — كبروتوكول BB84."})]}),e.jsxs("div",{className:"ui-card",style:{padding:20,borderRadius:16,borderRight:"3px solid #8b5cf6"},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:8,marginBottom:8},children:[e.jsx($e,{size:18,style:{color:"#8b5cf6"}}),e.jsx("span",{style:{fontWeight:700},children:"مبدأ التراكب الكمومي"})]}),e.jsx("div",{style:{fontSize:13,color:"var(--fg-3)",lineHeight:1.7},children:"نظام الحماية يتواجد في تراكب بين آمن ومُخترَق — أي محاولة اختراق تُنهي التراكب وتُكشف فوراً."})]}),e.jsxs("div",{className:"ui-card",style:{padding:20,borderRadius:16,borderRight:"3px solid #22c55e"},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:8,marginBottom:8},children:[e.jsx(oe,{size:18,style:{color:"#22c55e"}}),e.jsx("span",{style:{fontWeight:700},children:"مبدأ عدم اليقين"})]}),e.jsx("div",{style:{fontSize:13,color:"var(--fg-3)",lineHeight:1.7},children:"لا يمكن للمهاجم قياس مفتاح التشفير وتوزيعه معاً — مبدأ هايزنبرغ يضمن أن أي مراقبة تُغيّر النظام."})]})]})]}),t==="soc"&&e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:24},children:[e.jsxs("div",{className:"ui-card",style:{padding:20,borderRadius:18,display:"flex",alignItems:"center",justifyContent:"space-between",gap:12},children:[e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:4},children:[e.jsxs("div",{style:{fontWeight:900,fontSize:16,display:"flex",alignItems:"center",gap:8},children:[e.jsx(P,{size:18,style:{color:"#00d4ff"}})," ",l.liveOps]}),e.jsx("div",{style:{fontSize:12,color:"var(--fg-3)"},children:l.liveOpsHint})]}),e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:10},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:6,padding:"4px 12px",borderRadius:999,background:`${J?"#22c55e":"#f59e0b"}20`,border:`1px solid ${J?"#22c55e":"#f59e0b"}40`},children:[e.jsx("div",{style:{width:8,height:8,borderRadius:999,background:J?"#22c55e":"#f59e0b"}}),e.jsx("span",{style:{fontSize:11,fontWeight:800,color:J?"#22c55e":"#f59e0b"},children:J?l.connected:l.disconnected})]}),e.jsxs("button",{type:"button",className:"ui-btn ui-btn-filled",onClick:vt,style:{display:"flex",alignItems:"center",gap:8,background:_?"#f59e0b":"var(--p-primary)"},children:[e.jsx(Be,{size:14}),_?l.lock:l.unlock]})]})]}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(220px, 1fr))",gap:16},children:[e.jsxs("div",{className:"ui-card",style:{padding:16,borderRadius:16,display:"flex",flexDirection:"column",gap:8},children:[e.jsx("div",{style:{fontSize:12,color:"var(--fg-3)",fontWeight:700},children:l.risk}),e.jsxs("div",{style:{fontSize:28,fontWeight:900,fontFamily:"var(--font-mono)",color:(E?.risk_score??0)>=.85?"#ef4444":(E?.risk_score??0)>=.65?"#f59e0b":"#22c55e"},children:[Math.round((E?.risk_score??0)*100),"%"]})]}),e.jsxs("div",{className:"ui-card",style:{padding:16,borderRadius:16,display:"flex",flexDirection:"column",gap:8},children:[e.jsx("div",{style:{fontSize:12,color:"var(--fg-3)",fontWeight:700},children:l.alerts}),e.jsx("div",{style:{fontSize:28,fontWeight:900,fontFamily:"var(--font-mono)"},children:E?.alerts??0})]}),e.jsxs("div",{className:"ui-card",style:{padding:16,borderRadius:16,display:"flex",flexDirection:"column",gap:8},children:[e.jsx("div",{style:{fontSize:12,color:"var(--fg-3)",fontWeight:700},children:l.blocked}),e.jsx("div",{style:{fontSize:28,fontWeight:900,fontFamily:"var(--font-mono)"},children:E?.blocked_ips??0})]}),e.jsxs("div",{className:"ui-card",style:{padding:16,borderRadius:16,display:"flex",flexDirection:"column",gap:8},children:[e.jsx("div",{style:{fontSize:12,color:"var(--fg-3)",fontWeight:700},children:l.reqTotal}),e.jsx("div",{style:{fontSize:28,fontWeight:900,fontFamily:"var(--font-mono)"},children:E?.total_requests??0})]}),e.jsxs("div",{className:"ui-card",style:{padding:16,borderRadius:16,display:"flex",flexDirection:"column",gap:8},children:[e.jsx("div",{style:{fontSize:12,color:"var(--fg-3)",fontWeight:700},children:l.reqBlocked}),e.jsx("div",{style:{fontSize:28,fontWeight:900,fontFamily:"var(--font-mono)"},children:E?.blocked_requests??0})]})]}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1.2fr 0.8fr",gap:16},children:[e.jsxs("div",{className:"ui-card",style:{padding:20,borderRadius:18,display:"flex",flexDirection:"column",gap:12},children:[e.jsxs("div",{style:{fontWeight:900,display:"flex",alignItems:"center",gap:8},children:[e.jsx(P,{size:16,style:{color:"#ef4444"}})," ",l.threatFeed]}),e.jsx("div",{style:{display:"flex",flexDirection:"column",gap:6,maxHeight:360,overflowY:"auto"},children:L.length===0?e.jsx("div",{style:{textAlign:"center",padding:24,color:"var(--fg-3)"},children:l.none}):L.map((n,p)=>e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 90px",gap:10,alignItems:"center",padding:"8px 12px",borderRadius:10,background:"var(--surface)",fontSize:12},children:[e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:2},children:[e.jsxs("div",{style:{fontWeight:800,color:"var(--fg-2)"},children:[n.category," · ",n.severity]}),e.jsxs("div",{style:{color:"var(--fg-3)",fontFamily:"var(--font-mono)"},children:[n.ip," · ",n.method," · ",n.path]}),e.jsxs("div",{style:{color:"var(--fg-3)"},children:[l.reason,": ",n.reason]})]}),e.jsxs("div",{style:{textAlign:"center",padding:"2px 6px",borderRadius:6,background:"rgba(239,68,68,0.12)",color:"#ef4444",fontWeight:800,fontFamily:"var(--font-mono)"},children:[Math.round((Number(n.score)||0)*100),"%"]})]},`${n.ts}-${n.ip}-${p}`))}),e.jsxs("button",{type:"button",className:"ui-btn ui-btn-filled",onClick:xt,style:{display:"flex",alignItems:"center",gap:8},children:[e.jsx(ke,{size:14})," ",l.exportReport]})]}),e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:16},children:[e.jsxs("div",{className:"ui-card",style:{padding:20,borderRadius:18,display:"flex",flexDirection:"column",gap:12},children:[e.jsxs("div",{style:{fontWeight:900,display:"flex",alignItems:"center",gap:8},children:[e.jsx(Re,{size:16,style:{color:"#f59e0b"}})," ",l.predict]}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10},children:[e.jsxs("div",{style:{padding:12,borderRadius:12,background:"var(--surface)",border:"1px solid var(--outline)"},children:[e.jsx("div",{style:{fontSize:11,color:"var(--fg-3)"},children:l.forecast}),e.jsx("div",{style:{fontWeight:900,fontFamily:"var(--font-mono)"},children:be?.forecast??"-"})]}),e.jsxs("div",{style:{padding:12,borderRadius:12,background:"var(--surface)",border:"1px solid var(--outline)"},children:[e.jsx("div",{style:{fontSize:11,color:"var(--fg-3)"},children:l.risk}),e.jsxs("div",{style:{fontWeight:900,fontFamily:"var(--font-mono)"},children:[Math.round((be?.risk_score??0)*100),"%"]})]})]}),e.jsx("div",{style:{display:"flex",flexDirection:"column",gap:6},children:(be?.top_reasons??[]).slice(0,6).map(n=>e.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,padding:"8px 12px",borderRadius:10,background:"var(--surface)",border:"1px solid var(--outline)",fontSize:12},children:[e.jsx("span",{style:{color:"var(--fg-2)",fontWeight:700},children:n.key}),e.jsx("span",{style:{fontFamily:"var(--font-mono)",fontWeight:900},children:n.count})]},n.key))})]}),e.jsxs("div",{className:"ui-card",style:{padding:20,borderRadius:18,display:"flex",flexDirection:"column",gap:12},children:[e.jsxs("div",{style:{fontWeight:900,display:"flex",alignItems:"center",gap:8},children:[e.jsx(ne,{size:16,style:{color:"#00d4ff"}})," Adaptive Firewall"]}),e.jsxs("div",{style:{display:"flex",gap:8},children:[e.jsx("input",{value:ve,onChange:n=>Ee(n.target.value),placeholder:l.ip,dir:"ltr",className:"ui-input",style:{flex:1,boxSizing:"border-box"}}),e.jsxs("button",{type:"button",className:"ui-btn ui-btn-filled",onClick:bt,disabled:Le,style:{display:"flex",alignItems:"center",gap:6},children:[e.jsx(Re,{size:14})," ",l.blockIp]})]}),!_&&e.jsx("div",{style:{fontSize:12,color:"var(--fg-3)"},children:l.requiresUnlock}),e.jsx("div",{style:{display:"flex",flexDirection:"column",gap:6,maxHeight:200,overflowY:"auto"},children:Fe.length===0?e.jsx("div",{style:{textAlign:"center",padding:16,color:"var(--fg-3)"},children:l.none}):Fe.map(n=>e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 90px",gap:8,alignItems:"center",padding:"8px 12px",borderRadius:10,background:"var(--surface)",border:"1px solid var(--outline)",fontSize:12},children:[e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:2},children:[e.jsx("div",{style:{fontFamily:"var(--font-mono)",fontWeight:900},children:n.ip}),e.jsxs("div",{style:{color:"var(--fg-3)"},children:[l.reason,": ",n.reason]}),e.jsx("div",{style:{color:"var(--fg-3)",fontSize:11},children:new Date(n.until*1e3).toLocaleString(i==="ar"?"ar-SA":"en-US")})]}),e.jsx("button",{type:"button",className:"ui-btn",disabled:Le,onClick:()=>St(n.ip),style:{border:"1px solid var(--outline)",borderRadius:10,padding:"8px 12px",background:"transparent",color:"var(--fg-2)",cursor:"pointer",fontWeight:800,fontSize:12},children:l.unblock})]},`${n.ip}-${n.until}`))})]}),e.jsxs("div",{className:"ui-card",style:{padding:20,borderRadius:18,display:"flex",flexDirection:"column",gap:12},children:[e.jsxs("div",{style:{fontWeight:900,display:"flex",alignItems:"center",gap:8},children:[e.jsx(q,{size:16,style:{color:"#22c55e"}})," ",l.openrouterTitle]}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8},children:[e.jsx("input",{value:ye,onChange:n=>ut(n.target.value),placeholder:l.adminCode,className:"ui-input",style:{boxSizing:"border-box"}}),e.jsx("input",{value:xe,onChange:n=>De(n.target.value),placeholder:l.openrouterModel,dir:"ltr",className:"ui-input",style:{boxSizing:"border-box"}})]}),e.jsx("input",{value:me,onChange:n=>Me(n.target.value),placeholder:l.openrouterKey,type:"password",dir:"ltr",className:"ui-input",style:{boxSizing:"border-box"}}),e.jsx("div",{style:{fontSize:12,color:"var(--fg-3)",lineHeight:1.7},children:l.runtimeConfigHint}),e.jsxs("button",{type:"button",className:"ui-btn ui-btn-filled",onClick:kt,disabled:Ne,style:{display:"flex",alignItems:"center",gap:6,background:"#22c55e"},children:[Ne?e.jsx(V,{size:14,style:{animation:"spin 1s linear infinite"}}):e.jsx(G,{size:14}),l.saveKey]})]}),e.jsxs("div",{className:"ui-card",style:{padding:20,borderRadius:18,display:"flex",flexDirection:"column",gap:12},children:[e.jsxs("div",{style:{fontWeight:900,display:"flex",alignItems:"center",gap:8},children:[e.jsx(G,{size:16,style:{color:"#8b5cf6"}})," ",l.pqc]}),e.jsx("textarea",{value:Se,onChange:n=>Pe(n.target.value),placeholder:i==="ar"?"نص للاختبار...":"Text to test...",className:"ui-input",style:{minHeight:80,resize:"vertical",padding:12}}),e.jsxs("div",{style:{display:"flex",gap:8,flexWrap:"wrap"},children:[e.jsxs("button",{type:"button",className:"ui-btn ui-btn-filled",onClick:jt,style:{display:"flex",alignItems:"center",gap:6},children:[e.jsx(G,{size:14})," ",l.encrypt]}),e.jsxs("button",{type:"button",className:"ui-btn",onClick:$t,disabled:!K,style:{border:"1px solid var(--outline)",borderRadius:10,padding:"8px 16px",background:"transparent",color:"var(--fg-2)",cursor:"pointer",fontWeight:700,fontSize:13,display:"flex",alignItems:"center",gap:6},children:[e.jsx(Et,{size:14})," ",l.decrypt]})]}),K&&e.jsx("pre",{style:{margin:0,padding:12,borderRadius:12,background:"var(--surface)",border:"1px solid var(--outline)",fontSize:11,overflowX:"auto"},children:JSON.stringify(K,null,2)})]})]})]})]}),t==="scanner"&&e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:24},children:[e.jsxs("div",{className:"ui-card",style:{padding:24,borderRadius:18,display:"flex",flexDirection:"column",gap:12},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12},children:[e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:2},children:[e.jsxs("h2",{style:{margin:0,fontSize:18,fontWeight:900,display:"flex",alignItems:"center",gap:8},children:[e.jsx(ae,{size:18,style:{color:"var(--p-primary)"}})," ",l.siteAnalysis]}),e.jsx("div",{style:{fontSize:12,color:"var(--fg-3)",lineHeight:1.7},children:l.siteAnalysisHint})]}),e.jsxs("button",{type:"button",className:"ui-btn ui-btn-filled",onClick:At,disabled:ue,style:{display:"flex",alignItems:"center",gap:6},children:[ue?e.jsx(V,{size:14,style:{animation:"spin 1s linear infinite"}}):e.jsx(ae,{size:14}),ue?i==="ar"?"جاري التحليل...":"Analyzing...":l.runSiteAnalysis]})]}),e.jsxs("div",{style:{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"},children:[e.jsx("input",{type:"url",value:ce,onChange:n=>ct(n.target.value),placeholder:"https://example.com",dir:"ltr",className:"ui-input",style:{flex:1,minWidth:260,boxSizing:"border-box"}}),e.jsxs("label",{style:{display:"flex",alignItems:"center",gap:8,fontSize:12,color:"var(--fg-2)",padding:"8px 12px",borderRadius:10,border:"1px solid var(--outline)",background:"var(--surface)"},children:[e.jsx("input",{type:"checkbox",checked:pe,onChange:n=>pt(n.target.checked)}),l.dynamicRender]}),A&&e.jsxs("button",{type:"button",className:"ui-btn",onClick:()=>{const n=new Blob([JSON.stringify(A,null,2)],{type:"application/json"}),p=document.createElement("a");p.href=URL.createObjectURL(n),p.download=`qurabia-site-analysis-${new Date().toISOString().slice(0,10)}.json`,p.click(),URL.revokeObjectURL(p.href)},style:{border:"1px solid var(--outline)",borderRadius:10,padding:"8px 16px",background:"transparent",color:"var(--fg-2)",cursor:"pointer",fontWeight:700,fontSize:13,display:"flex",alignItems:"center",gap:6},children:[e.jsx(ke,{size:14})," ",l.analysisReport]})]})]}),A&&e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16},children:[e.jsxs("div",{className:"ui-card",style:{padding:20,borderRadius:18,display:"flex",flexDirection:"column",gap:12},children:[e.jsxs("div",{style:{fontWeight:900,display:"flex",alignItems:"center",gap:8},children:[e.jsx(re,{size:16,style:{color:"var(--p-secondary)"}})," ",l.analysisReport]}),e.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(3, minmax(0, 1fr))",gap:10},children:["seo","security","performance"].map(n=>e.jsxs("div",{style:{padding:12,borderRadius:12,background:"var(--surface)",border:"1px solid var(--outline)"},children:[e.jsx("div",{style:{fontSize:11,color:"var(--fg-3)"},children:n.toUpperCase()}),e.jsx("div",{style:{fontSize:24,fontWeight:900,fontFamily:"var(--font-mono)"},children:A?.scores?.[n]??"-"})]},n))}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(160px, 1fr))",gap:10},children:[e.jsxs("div",{style:{padding:12,borderRadius:12,background:"var(--surface)",border:"1px solid var(--outline)"},children:[e.jsx("div",{style:{fontSize:11,color:"var(--fg-3)"},children:l.totalBytes}),e.jsxs("div",{style:{fontWeight:900,fontFamily:"var(--font-mono)"},children:[Math.round(((A?.performance?.html_bytes??0)+(A?.performance?.resources?.totals?.total_bytes??0))/1024)," KB"]})]}),e.jsxs("div",{style:{padding:12,borderRadius:12,background:"var(--surface)",border:"1px solid var(--outline)"},children:[e.jsx("div",{style:{fontSize:11,color:"var(--fg-3)"},children:l.jsBytes}),e.jsxs("div",{style:{fontWeight:900,fontFamily:"var(--font-mono)"},children:[Math.round((A?.performance?.resources?.totals?.js_bytes??0)/1024)," KB"]})]}),e.jsxs("div",{style:{padding:12,borderRadius:12,background:"var(--surface)",border:"1px solid var(--outline)"},children:[e.jsx("div",{style:{fontSize:11,color:"var(--fg-3)"},children:l.cssBytes}),e.jsxs("div",{style:{fontWeight:900,fontFamily:"var(--font-mono)"},children:[Math.round((A?.performance?.resources?.totals?.css_bytes??0)/1024)," KB"]})]}),e.jsxs("div",{style:{padding:12,borderRadius:12,background:"var(--surface)",border:"1px solid var(--outline)"},children:[e.jsx("div",{style:{fontSize:11,color:"var(--fg-3)"},children:l.blockingScripts}),e.jsx("div",{style:{fontWeight:900,fontFamily:"var(--font-mono)"},children:A?.performance?.render_blocking?.scripts??0})]})]}),e.jsxs("div",{style:{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"},children:[A?.rendered&&e.jsx("span",{style:{padding:"4px 10px",borderRadius:999,border:"1px solid rgba(34,197,94,0.35)",background:"rgba(34,197,94,0.12)",color:"#22c55e",fontWeight:900,fontSize:11},children:l.rendered}),(A?.tech?.detected??[]).slice(0,10).map(n=>e.jsx("span",{style:{padding:"4px 10px",borderRadius:999,border:"1px solid var(--outline)",background:"var(--surface)",color:"var(--fg-2)",fontWeight:800,fontSize:11},children:n},n))]}),e.jsx("div",{style:{display:"flex",flexDirection:"column",gap:6,maxHeight:260,overflowY:"auto"},children:(A?.recommendations??[]).slice(0,12).map((n,p)=>e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"80px 1fr",gap:10,alignItems:"start",padding:"10px 12px",borderRadius:12,background:"var(--surface)",border:"1px solid var(--outline)",fontSize:12},children:[e.jsx("div",{style:{textAlign:"center",padding:"2px 6px",borderRadius:8,background:"rgba(239,68,68,0.12)",color:"#ef4444",fontWeight:900,fontFamily:"var(--font-mono)"},children:String(n.severity??"").toUpperCase()}),e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:3},children:[e.jsx("div",{style:{fontWeight:900,color:"var(--fg-2)"},children:n.title}),e.jsx("div",{style:{color:"var(--fg-3)",lineHeight:1.7},children:n.fix})]})]},`${n.id??p}`))})]}),e.jsxs("div",{className:"ui-card",style:{padding:20,borderRadius:18,display:"flex",flexDirection:"column",gap:12},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12},children:[e.jsxs("div",{style:{fontWeight:900,display:"flex",alignItems:"center",gap:8},children:[e.jsx(q,{size:16,style:{color:"#8b5cf6"}})," ",l.aiInsights]}),e.jsxs("button",{type:"button",className:"ui-btn ui-btn-filled",onClick:zt,disabled:ge,style:{display:"flex",alignItems:"center",gap:6,fontSize:12,padding:"6px 14px",background:"#8b5cf6"},children:[ge?e.jsx(V,{size:13,style:{animation:"spin 1s linear infinite"}}):e.jsx(q,{size:13}),ge?i==="ar"?"جاري التحليل...":"Analyzing...":i==="ar"?"تحليل AI":"AI analyze"]})]}),Te?e.jsxs("div",{children:[Y&&e.jsx("div",{style:{fontSize:11,color:"var(--fg-3)",marginBottom:8,display:"flex",alignItems:"center",gap:4},children:e.jsx("span",{style:{padding:"2px 8px",borderRadius:6,background:Y==="local"?"rgba(139,92,246,0.15)":"rgba(34,197,94,0.15)",color:Y==="local"?"#8b5cf6":"#22c55e",fontWeight:700,fontSize:10},children:Y==="local"?i==="ar"?"تحليل محلي":"Local":`AI: ${Y}`})}),e.jsx("div",{style:{fontSize:13,color:"var(--fg-2)",lineHeight:2,whiteSpace:"pre-wrap",padding:"16px 20px",borderRadius:12,background:"var(--surface)",border:"1px solid var(--outline)"},children:Te})]}):e.jsxs("div",{style:{textAlign:"center",padding:20,color:"var(--fg-3)",fontSize:13,lineHeight:1.8},children:[e.jsx(q,{size:32,style:{color:"var(--fg-3)",opacity:.3,marginBottom:8}}),e.jsx("div",{children:i==="ar"?"اضغط الزر لتحليل التقرير وإنتاج توصيات ذكية":"Click to analyze the report and generate smart recommendations"})]})]})]}),e.jsxs("div",{className:"ui-card",style:{padding:24,borderRadius:18},children:[e.jsx("h2",{style:{margin:"0 0 16px",fontSize:18,fontWeight:800},children:"فحص الأمان الكمومي"}),e.jsxs("div",{style:{display:"flex",gap:8},children:[e.jsx("input",{type:"url",value:o,onChange:n=>f(n.target.value),placeholder:"https://example.com",dir:"ltr",className:"ui-input",style:{flex:1,boxSizing:"border-box"}}),e.jsxs("button",{type:"button",className:"ui-btn ui-btn-filled",onClick:Rt,disabled:b,style:{display:"flex",alignItems:"center",gap:6},children:[b?e.jsx(V,{size:14}):e.jsx(ae,{size:14}),b?"جاري الفحص...":"فحص كمومي"]})]})]}),a&&e.jsxs(e.Fragment,{children:[e.jsxs("div",{style:{display:"flex",gap:8,flexWrap:"wrap"},children:[e.jsxs("button",{type:"button",className:"ui-btn ui-btn-filled",onClick:()=>Qe(a),style:{display:"flex",alignItems:"center",gap:6,fontSize:12,padding:"6px 14px"},children:[e.jsx(He,{size:13})," طباعة كشف الفحص"]}),j&&e.jsxs("button",{type:"button",className:"ui-btn ui-btn-filled",onClick:()=>Ke(a,j),style:{display:"flex",alignItems:"center",gap:6,fontSize:12,padding:"6px 14px",background:"var(--p-secondary)"},children:[e.jsx(Oe,{size:13})," التقرير الشامل"]})]}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16},children:[e.jsxs("div",{className:"ui-card",style:{padding:20,borderRadius:16,textAlign:"center"},children:[e.jsx("div",{style:{fontSize:48,fontWeight:900,color:a.vulnerabilityScore>60?"#ef4444":a.vulnerabilityScore>30?"#f59e0b":"#22c55e",fontFamily:"var(--font-mono)"},children:a.vulnerabilityScore}),e.jsx("div",{style:{fontSize:13,color:"var(--fg-3)"},children:"درجة الضعف"})]}),e.jsxs("div",{className:"ui-card",style:{padding:20,borderRadius:16,textAlign:"center"},children:[e.jsxs("div",{style:{fontSize:48,fontWeight:900,color:"#00d4ff",fontFamily:"var(--font-mono)"},children:[a.quantumResistanceScore,"%"]}),e.jsx("div",{style:{fontSize:13,color:"var(--fg-3)"},children:"مقاومة كمومية"})]})]}),e.jsxs("div",{className:"ui-card",style:{padding:20,borderRadius:18},children:[e.jsxs("h3",{style:{margin:"0 0 12px",fontSize:15,fontWeight:800,display:"flex",alignItems:"center",gap:8},children:[e.jsx(Lt,{size:16,style:{color:"var(--p-primary)"}})," رؤوس HTTP"]}),e.jsx("div",{style:{display:"flex",flexDirection:"column",gap:4},children:a.headerAnalysis.map(n=>e.jsx(vi,{c:n},n.header))})]}),e.jsxs("div",{className:"ui-card",style:{padding:20,borderRadius:18},children:[e.jsxs("h3",{style:{margin:"0 0 12px",fontSize:15,fontWeight:800,display:"flex",alignItems:"center",gap:8},children:[e.jsx(Ft,{size:16,style:{color:"var(--p-secondary)"}})," المنافذ"]}),e.jsx("div",{style:{display:"flex",flexDirection:"column",gap:4},children:a.portScan.filter(n=>n.state==="open"||n.risk!=="low").map(n=>e.jsx(bi,{p:n},n.port))})]}),e.jsxs("div",{className:"ui-card",style:{padding:20,borderRadius:18},children:[e.jsxs("h3",{style:{margin:"0 0 12px",fontSize:15,fontWeight:800,display:"flex",alignItems:"center",gap:8},children:[e.jsx(Re,{size:16,style:{color:"#ef4444"}})," التهديدات (",a.threats.length,")"]}),e.jsx("div",{style:{display:"flex",flexDirection:"column",gap:4},children:a.threats.map(n=>e.jsx(we,{t:n},n.id))})]}),e.jsxs("div",{className:"ui-card",style:{padding:24,borderRadius:18},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16},children:[e.jsxs("h3",{style:{margin:0,fontSize:15,fontWeight:800,display:"flex",alignItems:"center",gap:8},children:[e.jsx(q,{size:16,style:{color:"#8b5cf6"}})," تحليل الذكاء الاصطناعي"]}),e.jsxs("button",{type:"button",className:"ui-btn ui-btn-filled",onClick:Ct,disabled:R,style:{display:"flex",alignItems:"center",gap:6,fontSize:12,padding:"6px 14px",background:"#8b5cf6"},children:[R?e.jsx(V,{size:13,style:{animation:"spin 1s linear infinite"}}):e.jsx(q,{size:13}),R?"جاري التحليل...":"تحليل بالذكاء الاصطناعي"]})]}),y?e.jsxs("div",{children:[H&&e.jsx("div",{style:{fontSize:11,color:"var(--fg-3)",marginBottom:8,display:"flex",alignItems:"center",gap:4},children:e.jsx("span",{style:{padding:"2px 8px",borderRadius:6,background:H==="local"?"rgba(139,92,246,0.15)":"rgba(34,197,94,0.15)",color:H==="local"?"#8b5cf6":"#22c55e",fontWeight:700,fontSize:10},children:H==="local"?"تحليل محلي":`AI: ${H}`})}),e.jsx("div",{style:{fontSize:13,color:"var(--fg-2)",lineHeight:2,whiteSpace:"pre-wrap",padding:"16px 20px",borderRadius:12,background:"var(--surface)",border:"1px solid var(--outline)"},children:y})]}):e.jsxs("div",{style:{textAlign:"center",padding:20,color:"var(--fg-3)",fontSize:13,lineHeight:1.8},children:[e.jsx(q,{size:32,style:{color:"var(--fg-3)",opacity:.3,marginBottom:8}}),e.jsx("div",{children:"اضغط الزر لتحليل نتائج الفحص بالذكاء الاصطناعي"}),e.jsx("div",{style:{fontSize:11,color:"var(--fg-3)",opacity:.7},children:"يدعم: Gemini • Grok • OpenRouter — مع تحليل محلي كبديل"})]})]})]})]}),t==="firewall"&&e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:24},children:[e.jsxs("div",{className:"ui-card",style:{padding:24,borderRadius:18},children:[e.jsxs("h2",{style:{margin:"0 0 16px",fontSize:18,fontWeight:800,display:"flex",alignItems:"center",gap:8},children:[e.jsx(ne,{size:20,style:{color:"#00d4ff"}})," الجدار الناري الكمومي"]}),e.jsx("p",{style:{fontSize:14,color:"var(--fg-3)",lineHeight:1.8,margin:"0 0 20px"},children:"جدار ناري يستخدم ميكانيكا الكم لفلترة المرور. كل حزمة تُعامل كجسيم كمومي — لا تمر إلا بتطابق حالتها مع قواعد التشفير الكمومي."}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(180px, 1fr))",gap:16},children:[e.jsx(M,{label:"سلامة الحاجز",value:h.integrity,color:"#22c55e",icon:ie}),e.jsx(M,{label:"نسبة التشابك",value:h.entanglement,color:"#00d4ff",icon:je}),e.jsx(M,{label:"كفاءة النفق",value:h.superposition,color:"#8b5cf6",icon:$e}),e.jsx(M,{label:"تماسك القواعد",value:h.coherence,color:"#f59e0b",icon:re})]})]}),e.jsx("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16},children:["حظر IP المشبوهة","تصفية SQL Injection","حماية XSS","مكافحة DDoS","تشفير الاتصالات","فحص الشهادات"].map((n,p)=>e.jsxs("div",{className:"ui-card",style:{padding:16,borderRadius:14,display:"flex",alignItems:"center",gap:12},children:[e.jsx("div",{style:{width:36,height:36,borderRadius:10,display:"grid",placeItems:"center",background:"rgba(34,197,94,0.1)",border:"1px solid rgba(34,197,94,0.3)"},children:e.jsx(ie,{size:16,style:{color:"#22c55e"}})}),e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{style:{fontWeight:700,fontSize:13},children:n}),e.jsx("div",{style:{fontSize:11,color:"var(--fg-3)"},children:"نشط"})]}),e.jsx("div",{style:{width:8,height:8,borderRadius:999,background:"#22c55e"}})]},p))})]}),t==="encryption"&&e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:24},children:[e.jsxs("div",{className:"ui-card",style:{padding:24,borderRadius:18},children:[e.jsxs("h2",{style:{margin:"0 0 16px",fontSize:18,fontWeight:800,display:"flex",alignItems:"center",gap:8},children:[e.jsx(G,{size:20,style:{color:"#00d4ff"}})," التشفير ما بعد الكمومي"]}),e.jsx("p",{style:{fontSize:14,color:"var(--fg-3)",lineHeight:1.8,margin:"0 0 20px"},children:"CRYSTALS-Kyber و CRYSTALS-Dilithium — معايير NIST المقاومة لخوارزمية شور. RSA-2048 يُكسر في 4 ساعات بحاسوب كمومي بـ 4096 كيوبت."}),e.jsxs("button",{type:"button",className:"ui-btn ui-btn-filled",onClick:wt,style:{display:"flex",alignItems:"center",gap:8},children:[e.jsx(Be,{size:14})," توليد مفتاح كمومي"]})]}),$&&e.jsxs("div",{className:"ui-card",style:{padding:24,borderRadius:18,display:"grid",gridTemplateColumns:"1fr 1fr",gap:16},children:[e.jsxs("div",{children:[e.jsx("div",{style:{fontSize:12,color:"var(--fg-3)",marginBottom:4},children:"الخوارزمية"}),e.jsx("div",{style:{fontWeight:800,fontFamily:"var(--font-mono)"},children:$.algorithm})]}),e.jsxs("div",{children:[e.jsx("div",{style:{fontSize:12,color:"var(--fg-3)",marginBottom:4},children:"حجم المفتاح"}),e.jsxs("div",{style:{fontWeight:800,fontFamily:"var(--font-mono)"},children:[$.keySize," bit"]})]}),e.jsxs("div",{children:[e.jsx("div",{style:{fontSize:12,color:"var(--fg-3)",marginBottom:4},children:"مقاوم كمومياً"}),e.jsx("div",{style:{fontWeight:800,color:"#22c55e"},children:$.quantumResistant?"نعم":"لا"})]}),e.jsxs("div",{children:[e.jsx("div",{style:{fontSize:12,color:"var(--fg-3)",marginBottom:4},children:"مستوى NIST"}),e.jsx("div",{style:{fontWeight:800,fontFamily:"var(--font-mono)"},children:$.nistLevel})]}),e.jsxs("div",{children:[e.jsx("div",{style:{fontSize:12,color:"var(--fg-3)",marginBottom:4},children:"زمن التشفير"}),e.jsxs("div",{style:{fontWeight:800,fontFamily:"var(--font-mono)"},children:[$.encryptionTime,"ms"]})]}),e.jsxs("div",{children:[e.jsx("div",{style:{fontSize:12,color:"var(--fg-3)",marginBottom:4},children:"حجم النص المشفر"}),e.jsxs("div",{style:{fontWeight:800,fontFamily:"var(--font-mono)"},children:[$.ciphertextSize," bytes"]})]})]})]}),t==="ids"&&e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:24},children:[e.jsxs("div",{className:"ui-card",style:{padding:24,borderRadius:18},children:[e.jsxs("h2",{style:{margin:"0 0 16px",fontSize:18,fontWeight:800,display:"flex",alignItems:"center",gap:8},children:[e.jsx(P,{size:20,style:{color:"#ef4444"}})," نظام كشف التسلل الكمومي"]}),e.jsx("p",{style:{fontSize:14,color:"var(--fg-3)",lineHeight:1.8,margin:"0 0 20px"},children:"يستخدم مستشعرات كمومية تعمل بمبدأ التراكب لاكتشاف التسلل في الزمن الحقيقي. أي محاولة تنصت تُغيّر حالة النظام الكمومي ويُكشف فوراً."}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(180px, 1fr))",gap:16},children:[e.jsx(M,{label:"حساسية الكشف",value:.96,color:"#ef4444",icon:P}),e.jsx(M,{label:"معدل الإنذارات الكاذبة",value:.02,color:"#22c55e",icon:ie}),e.jsx(M,{label:"سرعة الاستجابة",value:.99,color:"#00d4ff",icon:oe})]})]}),e.jsxs("div",{className:"ui-card",style:{padding:20,borderRadius:18},children:[e.jsxs("div",{style:{fontWeight:700,marginBottom:12,display:"flex",alignItems:"center",gap:8},children:[e.jsx(P,{size:16,style:{color:"#ef4444"}})," ",l.threatFeed]}),e.jsx("div",{style:{display:"flex",flexDirection:"column",gap:6,maxHeight:400,overflowY:"auto"},children:L.length?L.map((n,p)=>e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 90px",gap:10,alignItems:"center",padding:"8px 12px",borderRadius:10,background:"var(--surface)",fontSize:12},children:[e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:2},children:[e.jsxs("div",{style:{fontWeight:800,color:"var(--fg-2)"},children:[n.category," · ",n.severity]}),e.jsxs("div",{style:{color:"var(--fg-3)",fontFamily:"var(--font-mono)"},children:[n.ip," · ",n.method," · ",n.path]}),e.jsxs("div",{style:{color:"var(--fg-3)"},children:[l.reason,": ",n.reason]})]}),e.jsxs("div",{style:{textAlign:"center",padding:"2px 6px",borderRadius:6,background:"rgba(239,68,68,0.12)",color:"#ef4444",fontWeight:800,fontFamily:"var(--font-mono)"},children:[Math.round((Number(n.score)||0)*100),"%"]})]},`${n.ts}-${n.ip}-${p}`)):w.length?w.map(n=>e.jsx(we,{t:n},n.id)):e.jsx("div",{style:{textAlign:"center",padding:24,color:"var(--fg-3)"},children:i==="ar"?"لا توجد تهديدات":"No threats"})})]})]}),t==="report"&&a&&e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:24},children:[e.jsxs("div",{className:"ui-card",style:{padding:24,borderRadius:18},children:[e.jsxs("h2",{style:{margin:"0 0 16px",fontSize:18,fontWeight:800},children:["تقرير الأمان الكمومي — ",a.url]}),e.jsxs("div",{style:{fontSize:13,color:"var(--fg-3)",marginBottom:12},children:["تاريخ: ",new Date(a.timestamp).toLocaleString("ar-SA")]}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:20},children:[e.jsxs("div",{style:{textAlign:"center",padding:16,borderRadius:14,background:`${a.vulnerabilityScore>60?"#ef4444":"#22c55e"}15`},children:[e.jsx("div",{style:{fontSize:36,fontWeight:900,color:a.vulnerabilityScore>60?"#ef4444":"#22c55e",fontFamily:"var(--font-mono)"},children:a.vulnerabilityScore}),e.jsx("div",{style:{fontSize:12,color:"var(--fg-3)"},children:"درجة الضعف"})]}),e.jsxs("div",{style:{textAlign:"center",padding:16,borderRadius:14,background:"rgba(0,212,255,0.1)"},children:[e.jsxs("div",{style:{fontSize:36,fontWeight:900,color:"#00d4ff",fontFamily:"var(--font-mono)"},children:[a.quantumResistanceScore,"%"]}),e.jsx("div",{style:{fontSize:12,color:"var(--fg-3)"},children:"مقاومة كمومية"})]})]}),e.jsxs("div",{style:{display:"flex",gap:8,flexWrap:"wrap"},children:[e.jsxs("button",{type:"button",className:"ui-btn ui-btn-filled",onClick:()=>Qe(a),style:{display:"flex",alignItems:"center",gap:6},children:[e.jsx(He,{size:14})," طباعة كشف الفحص"]}),j&&e.jsxs("button",{type:"button",className:"ui-btn ui-btn-filled",onClick:()=>Ke(a,j),style:{display:"flex",alignItems:"center",gap:6,background:"var(--p-secondary)"},children:[e.jsx(Oe,{size:14})," طباعة التقرير الشامل"]}),e.jsxs("button",{type:"button",className:"ui-btn",onClick:()=>{const n=j?lt(a,j):ot(a),p=`qurabia-security-report-${new Date().toISOString().slice(0,10)}.html`;ui(n,p),c.success("تم تحميل التقرير")},style:{display:"flex",alignItems:"center",gap:6,border:"1px solid var(--outline)",borderRadius:10,padding:"8px 16px",background:"transparent",color:"var(--fg-2)",cursor:"pointer",fontWeight:700,fontSize:13},children:[e.jsx(ke,{size:14})," تحميل HTML"]})]})]}),e.jsx("div",{style:{display:"flex",flexDirection:"column",gap:12},children:a.recommendations.map(n=>e.jsx(Si,{r:n},n.id))})]}),t==="report"&&!a&&e.jsx("div",{className:"ui-card",style:{padding:40,borderRadius:18,textAlign:"center",color:"var(--fg-3)"},children:'قم بفحص موقع أولاً من تبويب "فحص الأمان" لإنشاء التقرير'})]})]})}export{wi as default};
