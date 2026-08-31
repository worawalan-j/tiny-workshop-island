(() => {
  const root = document.getElementById('app');
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  
// ภาพฉากหลัง Pixel Art
const backgroundImage = new Image();
backgroundImage.src = './assets/backgrounds/sky_forest_mountains.png';
  
  const missionText = document.getElementById('missionText');
  const progressFill = document.getElementById('progressFill');
  const startScreen = document.getElementById('startScreen');
  const dialog = document.getElementById('dialog');
  const speaker = document.getElementById('speaker');
  const dialogText = document.getElementById('dialogText');
  const choices = document.getElementById('choices');
  const modal = document.getElementById('modal');
  const toast = document.getElementById('toast');

  const W = canvas.width;
  const H = canvas.height;
  const WORLD_W = 4200;
  const FLOOR = 456;
  const GRAVITY = 1500;
  const RUN_SPEED = 230;
  const JUMP_SPEED = 565;

  let selectedGender = 'female';
  let playerName = '';
  let started = false;
  let quest = 0;
  let score = 0;
  let wrong = {};
  let learned = new Set();
  let soundOn = true;
  let audioCtx = null;
  let lastTime = performance.now();
  let cameraX = 0;
  let frameClock = 0;
  let jumpQueued = false;
  const keys = { left: false, right: false };

  const player = {
    x: 105,
    y: FLOOR - 54,
    vx: 0,
    vy: 0,
    w: 34,
    h: 54,
    onGround: true,
    face: 1,
    checkpointX: 105,
    checkpointY: FLOOR - 54
  };

  const objectives = [
    'คุยกับครูไม้ที่หน้าทางเข้าเวิร์กช็อป',
    'วัดป้ายไม้ก่อนซ่อม',
    'ตรวจชั้นวางที่เอียง',
    'เลือกไขควงให้ตรงกับหัวสกรู',
    'ช่วยขันนอตขาโต๊ะ',
    'ช่วยน้องนอตหยิบชิ้นส่วนจากซอกแคบ',
    'เลือกค้อนสำหรับงานประกอบ',
    'เรียนรู้เครื่องมือตัดและตกแต่ง',
    'กลับไปหาครูไม้เพื่อทำภารกิจสุดท้าย',
    'ภารกิจสำเร็จ!'
  ];

  const zones = [
    { x: 210, label: 'ครูไม้' },
    { x: 640, label: 'มุมวัดและตรวจสอบ' },
    { x: 1120, label: 'ชั้นวางเอียง' },
    { x: 1580, label: 'มุมไขควง' },
    { x: 2070, label: 'โต๊ะนอต' },
    { x: 2540, label: 'น้องนอต' },
    { x: 3020, label: 'โต๊ะประกอบ' },
    { x: 3490, label: 'มุมตัดและตกแต่ง' },
    { x: 3950, label: 'ป้ายเวิร์กช็อป' }
  ];

  const tools = {
    tape: ['📏','ตลับเมตร','เครื่องมือวัด','ใช้วัดความยาวหรือระยะต่าง ๆ','เก็บสายกลับอย่างระมัดระวัง'],
    ruler: ['📐','ไม้บรรทัดเหล็ก','เครื่องมือวัด','เหมาะสำหรับวัดระยะสั้นและช่วยกำหนดแนวตรง','ตรวจขอบและสเกลก่อนใช้งาน'],
    square: ['◻️','ฉากเหล็ก','เครื่องมือวัดและตรวจสอบ','ใช้ตรวจสอบหรือกำหนดมุมฉาก 90 องศา','วางแนบกับชิ้นงานอย่างมั่นคง'],
    level: ['🟩','ระดับน้ำ','เครื่องมือตรวจสอบ','ใช้ตรวจแนวระดับหรือแนวดิ่งของชิ้นงาน','สังเกตตำแหน่งฟองอากาศในหลอดระดับ'],
    phillips: ['✚','ไขควงแฉก','เครื่องมือขันและยึด','ใช้กับสกรูที่มีร่องหัวเป็นรูปกากบาท','เลือกขนาดปลายให้เหมาะกับหัวสกรู'],
    flat: ['➖','ไขควงปากแบน','เครื่องมือขันและยึด','ใช้กับสกรูที่มีร่องหัวเป็นเส้นตรง','เลือกปลายไขควงให้พอดีกับร่อง'],
    wrench: ['🔧','ประแจ','เครื่องมือขันและยึด','ใช้สำหรับขันหรือคลายนอตและโบลต์','เลือกขนาดให้พอดีกับหัวนอต'],
    adjustable: ['🔧','ประแจเลื่อน','เครื่องมือขันและยึด','ปรับขนาดปากให้เหมาะกับหัวนอตได้หลายขนาด','ปรับปากให้กระชับกับชิ้นงาน'],
    pliers: ['🗜️','คีมปากจิ้งจก','เครื่องมือจับ','ใช้จับ ยึด หรือดัดชิ้นงานบางประเภท','ไม่ควรใช้แทนประแจในงานทั่วไป'],
    longnose: ['📎','คีมปากยาว','เครื่องมือจับ','เหมาะสำหรับจับชิ้นส่วนเล็กในพื้นที่แคบ','ใช้แรงพอเหมาะเพื่อไม่ให้ชิ้นงานเสียรูป'],
    clamp: ['🗜️','แคลมป์','เครื่องมือยึดชิ้นงาน','ใช้ยึดชิ้นงานให้อยู่กับที่ระหว่างทำงาน','ตรวจให้ชิ้นงานมั่นคงก่อนเริ่มงาน'],
    claw: ['🔨','ค้อนหงอน','เครื่องมือตอกและประกอบ','ใช้ในงานตอกและถอนตะปู','ตรวจสภาพเครื่องมือและพื้นที่รอบตัว'],
    rubber: ['🔨','ค้อนยาง','เครื่องมือตอกและประกอบ','ใช้เคาะจัดตำแหน่งโดยลดโอกาสเกิดรอยบนพื้นผิว','ใช้แรงให้เหมาะสมกับชิ้นงาน'],
    saw: ['🪚','เลื่อยมือ','เครื่องมือตัด','ใช้ตัดวัสดุตามชนิดงานที่เหมาะสม','ควรใช้ภายใต้การดูแลของครูหรือผู้มีความรู้'],
    file: ['🧰','ตะไบ','เครื่องมือตกแต่ง','ใช้ตกแต่ง ลดส่วนเกิน หรือปรับพื้นผิววัสดุบางประเภท','ยึดชิ้นงานให้มั่นคงเมื่อจำเป็น'],
    sand: ['🟫','กระดาษทราย','เครื่องมือตกแต่ง','ใช้ขัดตกแต่งผิวให้เรียบขึ้น','ใช้อุปกรณ์ป้องกันที่เหมาะสมกับงาน']
  };

  const platforms = [
    { x: 0, y: FLOOR, w: 4200, h: 84, type: 'ground' },
    { x: 410, y: 388, w: 175, h: 22, type: 'grass' },
    { x: 890, y: 372, w: 190, h: 22, type: 'wood' },
    { x: 1365, y: 398, w: 150, h: 22, type: 'grass' },
    { x: 1760, y: 356, w: 185, h: 22, type: 'wood' },
    { x: 2240, y: 392, w: 165, h: 22, type: 'grass' },
    { x: 2750, y: 365, w: 195, h: 22, type: 'wood' },
    { x: 3260, y: 388, w: 180, h: 22, type: 'grass' },
    { x: 3715, y: 350, w: 185, h: 22, type: 'wood' }
  ];

  function tone(freq = 620, duration = 0.08) {
    if (!soundOn) return;
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'square';
      osc.frequency.value = freq;
      gain.gain.value = 0.024;
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      osc.stop(audioCtx.currentTime + duration);
    } catch (_) {}
  }

  function updateHUD() {
    missionText.textContent = objectives[Math.min(quest, objectives.length - 1)];
    progressFill.style.width = `${(Math.min(quest, 9) / 9) * 100}%`;
  }

  let toastTimer = null;
  function showToast(message) {
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.remove('hidden');
    toastTimer = setTimeout(() => toast.classList.add('hidden'), 1500);
  }

  function closeDialog() {
    dialog.classList.add('hidden');
    choices.innerHTML = '';
  }

  function showDialog(who, html, options = []) {
    speaker.textContent = who;
    dialogText.innerHTML = html;
    choices.innerHTML = '';
    options.forEach(option => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'choice';
      button.textContent = option.label;
      button.addEventListener('click', option.action);
      choices.appendChild(button);
    });
    dialog.classList.remove('hidden');
  }

  function showPanel(html) {
    modal.innerHTML = `<div class="panel">${html}</div>`;
    modal.classList.remove('hidden');
  }

  function hidePanel() {
    modal.classList.add('hidden');
    modal.innerHTML = '';
  }

  function learn(ids) {
    ids.forEach(id => learned.add(id));
    tone(870, 0.11);
  }

  function showCards(ids, next) {
    learn(ids);
    const cards = ids.map(id => {
      const t = tools[id];
      return `<article class="tool-card"><div class="tool-icon">${t[0]}</div><b>${t[1]}</b><small>${t[2]}<br>${t[3]}<br><b>ข้อควรรู้:</b> ${t[4]}</small></article>`;
    }).join('');
    showPanel(`
      <div class="panel-head"><div><span class="new-badge">✨ เครื่องมือใหม่!</span><br><b>ได้รับการ์ดความรู้</b></div></div>
      <div class="tool-grid">${cards}</div>
      <div style="text-align:right;margin-top:12px"><button id="cardNext" class="pixel-button" type="button">ไปต่อ →</button></div>
    `);
    document.getElementById('cardNext').addEventListener('click', () => { hidePanel(); next(); });
  }

  function advance() {
    quest += 1;
    player.checkpointX = Math.max(70, zones[Math.min(quest, 8)].x - 120);
    player.checkpointY = FLOOR - player.h;
    updateHUD();
    closeDialog();
    showToast(`ภารกิจใหม่: ${objectives[quest]}`);
    tone(720, 0.08);
  }

  function ask(who, html, optionLabels, correctIndex, hint, cardIds, after = advance) {
    showDialog(who, html, optionLabels.map((label, index) => ({
      label,
      action: () => {
        if (index === correctIndex) {
          if (!wrong[quest]) score += 10;
          closeDialog();
          showCards(cardIds, after);
        } else {
          wrong[quest] = true;
          tone(180, 0.13);
          showDialog('น้องนอต', `ยังไม่ใช่นะ 🤔<br>${hint}`, [
            { label: 'ลองอีกครั้ง', action: () => ask(who, html, optionLabels, correctIndex, hint, cardIds, after) }
          ]);
        }
      }
    })));
  }

  function intro() {
    showDialog('ครูไม้', `สวัสดี ${playerName}! วันนี้เวิร์กช็อปจะเปิดแล้ว แต่เมื่อคืนลมแรงทำให้อุปกรณ์หลายจุดหลวมและเอียงไปหมด`, [
      { label: 'เดี๋ยวฉันช่วยเอง!', action: advance },
      { label: 'ฉันยังไม่ค่อยรู้จักเครื่องมือเลย', action: () => showDialog('ครูไม้', 'ไม่เป็นไร เราจะเรียนรู้ไปพร้อมกับการทำภารกิจนี่แหละ', [{ label: 'เริ่มกันเลย!', action: advance }]) }
    ]);
  }

  function questMeasure() {
    ask('ครูไม้', 'ป้ายไม้หลวมแล้ว ก่อนซ่อมเราต้องรู้ขนาดของป้ายก่อน<br><b>ควรเลือกเครื่องมือใด?</b>',
      ['📏 ตลับเมตร','🔨 ค้อนหงอน','🗜️ คีมปากจิ้งจก'], 0,
      'มองหาเครื่องมือที่ออกแบบมาสำหรับวัดระยะ', ['tape','ruler'], () => {
        showPanel(`
          <div class="panel-head"><b>Mini Game — วัดป้ายไม้</b></div>
          <p>เลื่อนปลายตลับเมตรจากจุด A ไปให้เกือบถึงจุด B</p>
          <div style="border:4px dashed #9b7a55;background:#f5e4bc;padding:12px">
            <div style="display:flex;justify-content:space-between"><b>A</b><b>B</b></div>
            <input id="measure" type="range" min="0" max="100" value="18" style="width:100%;margin:14px 0;accent-color:#6fa94f">
            <div id="measureMsg" class="hint">ค่อย ๆ เลื่อนไปทาง B</div>
          </div>
          <button id="measureCheck" class="pixel-button" type="button" style="margin-top:10px">ยืนยันการวัด</button>
        `);
        document.getElementById('measureCheck').addEventListener('click', () => {
          const value = Number(document.getElementById('measure').value);
          if (value >= 88) { hidePanel(); advance(); }
          else document.getElementById('measureMsg').textContent = 'ยังไม่ถึงปลายป้าย ลองเลื่อนไปทาง B อีกนิด';
        });
      });
  }

  function questLevel() {
    ask('น้องนอต', 'กล่องบนชั้นวางไหลไปด้านเดียวเลย!<br><b>ควรใช้อะไรตรวจว่าชั้นวางอยู่ในแนวระดับ?</b>',
      ['🟩 ระดับน้ำ','🔧 ประแจ','📎 คีมปากยาว'], 0,
      'เครื่องมือนี้มีหลอดสำหรับสังเกตตำแหน่งฟองอากาศ', ['level','square'], advance);
  }

  function questScrewdriver() {
    ask('ครูไม้', 'สกรูที่บานพับมีร่องหัวเป็นรูปกากบาท<br><b>เครื่องมือใดเหมาะที่สุด?</b>',
      ['✚ ไขควงแฉก','➖ ไขควงปากแบน','🔧 ประแจ'], 0,
      'รูปร่างปลายเครื่องมือควรตรงกับร่องหัวสกรู', ['phillips','flat'], advance);
  }

  function questWrench() {
    ask('ครูไม้', 'หัวนอตที่ขาโต๊ะคลายออก<br><b>เครื่องมือใดเหมาะสำหรับขันหรือคลายนอต?</b>',
      ['🔧 ประแจ','📎 คีมปากยาว','🔨 ค้อนยาง'], 0,
      'เครื่องมือนี้ออกแบบมาให้จับหัวนอตได้พอดี', ['wrench','adjustable'], advance);
  }

  function questPliers() {
    ask('น้องนอต', 'แหวนรองตกอยู่ในซอกแคบ มือเอื้อมไม่ถึงเลย!<br><b>ควรเลือกอะไร?</b>',
      ['📎 คีมปากยาว','📏 ตลับเมตร','🔨 ค้อนหงอน'], 0,
      'เครื่องมือที่มีปลายเรียวยาวเหมาะกับพื้นที่แคบ', ['longnose','pliers','clamp'], advance);
  }

  function questHammer() {
    ask('ครูไม้', 'เราต้องเคาะชิ้นไม้ให้เข้าที่ แต่ไม่อยากให้ผิวชิ้นงานเป็นรอย<br><b>ควรเลือกอะไร?</b>',
      ['🔨 ค้อนยาง','🔨 ค้อนหงอน','🔧 ประแจ'], 0,
      'ลองเลือกค้อนที่มีผิวสัมผัสนุ่มกว่า', ['rubber','claw'], advance);
  }

  function questFinishing() {
    showPanel(`
      <div class="panel-head"><b>🪚 มุมตัดและตกแต่ง</b></div>
      <p>จับคู่เครื่องมือกับหน้าที่ให้ถูกต้อง</p>
      <div class="select-row"><b>เลื่อยมือ</b><select id="m1"><option value="">เลือกหน้าที่</option><option value="s">ตัดวัสดุตามชนิดงานที่เหมาะสม</option><option value="f">ลดส่วนเกินหรือปรับพื้นผิว</option><option value="p">ขัดผิวให้เรียบขึ้น</option></select></div>
      <div class="select-row"><b>ตะไบ</b><select id="m2"><option value="">เลือกหน้าที่</option><option value="p">ขัดผิวให้เรียบขึ้น</option><option value="f">ลดส่วนเกินหรือปรับพื้นผิว</option><option value="s">ตัดวัสดุตามชนิดงานที่เหมาะสม</option></select></div>
      <div class="select-row"><b>กระดาษทราย</b><select id="m3"><option value="">เลือกหน้าที่</option><option value="f">ลดส่วนเกินหรือปรับพื้นผิว</option><option value="s">ตัดวัสดุตามชนิดงานที่เหมาะสม</option><option value="p">ขัดผิวให้เรียบขึ้น</option></select></div>
      <div id="matchMsg" class="hint">เครื่องมือที่อาจก่อให้เกิดอันตรายควรใช้ภายใต้การดูแลของครูหรือผู้มีความรู้</div>
      <button id="matchCheck" class="pixel-button" type="button">ตรวจคำตอบ</button>
    `);
    document.getElementById('matchCheck').addEventListener('click', () => {
      const ok = document.getElementById('m1').value === 's' && document.getElementById('m2').value === 'f' && document.getElementById('m3').value === 'p';
      if (ok) {
        if (!wrong[quest]) score += 10;
        hidePanel();
        showCards(['saw','file','sand'], advance);
      } else {
        wrong[quest] = true;
        document.getElementById('matchMsg').textContent = 'ยังมีบางคู่สลับกันอยู่ ลองดูคำว่า “ตัด / ปรับผิว / ขัดผิว” อีกครั้ง';
        tone(180, 0.13);
      }
    });
  }

  function finalQuest() {
    ask('ครูไม้', `เกือบพร้อมเปิดเวิร์กช็อปแล้ว ${playerName}!<br><b>ลำดับใดเหมาะสมที่สุดก่อนติดป้าย?</b>`,
      ['วัดตำแหน่ง → ตรวจแนว → เลือกเครื่องมือให้เหมาะ → ตรวจความเรียบร้อย','ขันก่อน → ค่อยวัด → ถ้าเอียงค่อยแก้','เคาะก่อน → แล้วค่อยตรวจแนว'], 0,
      'งานช่างที่เป็นระบบควรเริ่มจากการวัดและตรวจสอบก่อน', [], finishGame);
  }

  function finishGame() {
    quest = 9;
    updateHUD();
    tone(980, 0.16);
    const stars = score >= 70 ? '★★★' : score >= 50 ? '★★☆' : '★☆☆';
    showPanel(`
      <div class="end">
        <div style="font-size:1.45rem;font-weight:900">🎉 ภารกิจสำเร็จ!</div>
        <div class="stars">${stars}</div>
        <p><b>${playerName}</b> ช่วยเปิดเวิร์กช็อปได้สำเร็จ</p>
        <p>คะแนน ${score}/80 · เรียนรู้เครื่องมือ 16 ชนิด</p>
        <p><b>ครูไม้:</b> “งานช่างไม่ได้เริ่มจากการออกแรง แต่เริ่มจากการสังเกต วัด และเลือกเครื่องมือให้เหมาะกับงาน”</p>
        <div class="summary-grid">
          <div><b>📏 วัดและตรวจสอบ</b><br>ตลับเมตร · ไม้บรรทัดเหล็ก · ฉากเหล็ก · ระดับน้ำ</div>
          <div><b>🔩 ขันและยึด</b><br>ไขควงแฉก · ไขควงปากแบน · ประแจ · ประแจเลื่อน</div>
          <div><b>🗜 จับและยึดชิ้นงาน</b><br>คีมปากจิ้งจก · คีมปากยาว · แคลมป์</div>
          <div><b>🔨 ตอกและประกอบ</b><br>ค้อนหงอน · ค้อนยาง</div>
          <div><b>🪚 ตัดและตกแต่ง</b><br>เลื่อยมือ · ตะไบ · กระดาษทราย</div>
          <div><b>🛡️ ความปลอดภัย</b><br>เลือกเครื่องมือให้เหมาะกับงาน ตรวจสภาพเครื่องมือ และรักษาพื้นที่ทำงานให้เป็นระเบียบ</div>
        </div>
        <button id="playAgain" class="pixel-button primary" type="button">เล่นอีกครั้ง</button>
      </div>
    `);
    document.getElementById('playAgain').addEventListener('click', resetGame);
  }

  function interact() {
    if (!started || !dialog.classList.contains('hidden') || !modal.classList.contains('hidden')) return;
    const zone = zones[Math.min(quest, 8)];
    if (Math.abs(player.x - zone.x) > 100) {
      showToast('เดินเข้าใกล้เครื่องหมาย ! ก่อน');
      return;
    }
    if (quest === 0) intro();
    else if (quest === 1) questMeasure();
    else if (quest === 2) questLevel();
    else if (quest === 3) questScrewdriver();
    else if (quest === 4) questWrench();
    else if (quest === 5) questPliers();
    else if (quest === 6) questHammer();
    else if (quest === 7) questFinishing();
    else if (quest === 8) finalQuest();
  }

  function openBook() {
    const ids = [...learned];
    const body = ids.length ? ids.map(id => {
      const t = tools[id];
      return `<article class="tool-card"><div class="tool-icon">${t[0]}</div><b>${t[1]}</b><small>${t[2]}<br>${t[3]}<br><b>ข้อควรรู้:</b> ${t[4]}</small></article>`;
    }).join('') : '<p>ยังไม่มีการ์ดเครื่องมือ ออกสำรวจและทำภารกิจก่อนนะ</p>';
    showPanel(`
      <div class="panel-head"><b>📘 สมุดเครื่องมือ ${ids.length}/16</b><button id="closeBook" class="pixel-button small" type="button">ปิด</button></div>
      <div class="tool-grid">${body}</div>
    `);
    document.getElementById('closeBook').addEventListener('click', hidePanel);
  }

  function resetGame() {
    hidePanel();
    closeDialog();
    quest = 0;
    score = 0;
    wrong = {};
    learned.clear();
    player.x = 105;
    player.y = FLOOR - player.h;
    player.vx = 0;
    player.vy = 0;
    player.onGround = true;
    player.face = 1;
    player.checkpointX = 105;
    player.checkpointY = FLOOR - player.h;
    cameraX = 0;
    started = false;
    startScreen.classList.remove('hidden');
    updateHUD();
  }

  function startGame() {
    const name = document.getElementById('playerName').value.trim();
    if (!name) {
      document.getElementById('nameHint').textContent = 'กรุณาตั้งชื่อตัวละครก่อนเริ่มเกม';
      return;
    }
    playerName = name.slice(0, 12);
    startScreen.classList.add('hidden');
    started = true;
    root.focus();
    showToast(`ยินดีต้อนรับ ${playerName}!`);
    updateHUD();
  }

  // ---------- Pixel drawing helpers ----------
  function rect(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }

  function pixelText(text, x, y, size = 14, color = '#fff3d4', align = 'left') {
    ctx.save();
    ctx.font = `bold ${size}px Tahoma`;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#4b3324';
    ctx.strokeText(text, x, y);
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  function cloud(x, y, scale = 1) {
    const c1 = '#fff4ce';
    const c2 = '#dff1d7';
    rect(x, y, 68*scale, 14*scale, c1);
    rect(x+16*scale, y-14*scale, 38*scale, 16*scale, c1);
    rect(x+39*scale, y-7*scale, 48*scale, 21*scale, c1);
    rect(x+9*scale, y+12*scale, 60*scale, 5*scale, c2);
  }

  function drawMountainLayer(offset, color, baseY, height, step) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, H);
    let x = -((offset % step) + step);
    while (x < W + step) {
      ctx.lineTo(x, baseY);
      ctx.lineTo(x + step*0.5, baseY - height);
      ctx.lineTo(x + step, baseY);
      x += step;
    }
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fill();
  }

  function pine(x, y, s, colors) {
    rect(x-5*s, y-34*s, 10*s, 38*s, '#6f4b34');
    const [dark, mid, light] = colors;
    for (let i=0;i<3;i++) {
      const yy = y - 72*s + i*20*s;
      const half = (26-i*3)*s;
      ctx.fillStyle = i===0 ? light : i===1 ? mid : dark;
      ctx.beginPath();
      ctx.moveTo(x, yy);
      ctx.lineTo(x-half, yy+36*s);
      ctx.lineTo(x+half, yy+36*s);
      ctx.closePath();
      ctx.fill();
    }
  }

  function broadTree(x, y, s=1) {
    rect(x-12*s, y-88*s, 24*s, 92*s, '#6c452e');
    rect(x-18*s, y-64*s, 8*s, 45*s, '#825336');
    rect(x+9*s, y-66*s, 8*s, 43*s, '#825336');
    const blobs = [
      [-36,-102,54,40,'#226a48'],[-8,-116,62,46,'#2f7e50'],[29,-102,52,40,'#246a45'],[-24,-83,54,38,'#3b8f55'],[15,-80,60,38,'#348751'],[-3,-100,42,30,'#51a75d']
    ];
    blobs.forEach(([dx,dy,w,h,c])=>rect(x+dx*s,y+dy*s,w*s,h*s,c));
  }

  function grassTuft(x,y,s=1) {
    rect(x,y-8*s,3*s,8*s,'#347b45');
    rect(x+4*s,y-12*s,3*s,12*s,'#4d9c4f');
    rect(x+8*s,y-7*s,3*s,7*s,'#2d7042');
  }

  function flower(x,y,color) {
    rect(x,y-3,3,3,color); rect(x-2,y-1,3,3,color); rect(x+2,y-1,3,3,color); rect(x,y+1,3,3,color); rect(x+1,y+4,1,6,'#3f8247');
  }

  function crate(x,y,scale=1) {
    rect(x,y-36*scale,44*scale,36*scale,'#8b5936');
    rect(x+4*scale,y-32*scale,36*scale,5*scale,'#c48b51');
    rect(x+4*scale,y-10*scale,36*scale,5*scale,'#c48b51');
    rect(x+19*scale,y-32*scale,5*scale,27*scale,'#67402a');
    rect(x+7*scale,y-26*scale,6*scale,6*scale,'#d5aa6d');
  }

  function workbench(x,y,kind=0) {
    rect(x,y-44,108,14,'#b77c45');
    rect(x+8,y-30,12,30,'#684127');
    rect(x+88,y-30,12,30,'#684127');
    rect(x+18,y-55,70,11,'#d39a59');
    if (kind===0) { // measuring
      rect(x+27,y-73,38,8,'#e2b73c'); rect(x+63,y-75,8,12,'#d7a333');
    } else if (kind===1) { // screwdrivers
      [0,1,2].forEach(i=>{rect(x+32+i*18,y-82,5,26,['#d85f3b','#e2ad34','#5b7bc4'][i]);rect(x+29+i*18,y-58,11,6,'#a9b4b5')});
    } else if (kind===2) { // wrench
      rect(x+30,y-72,42,7,'#aeb9b8'); rect(x+25,y-76,10,15,'#aeb9b8'); rect(x+70,y-76,10,15,'#aeb9b8');
    } else if (kind===3) { // finishing
      rect(x+22,y-73,40,7,'#c3c8c8'); rect(x+18,y-77,8,16,'#98623c'); rect(x+70,y-79,12,18,'#a1673c');
    }
  }

  function signpost(x, y, text) {
    rect(x-5,y-64,10,64,'#6b432b');
    rect(x-48,y-75,96,31,'#8f5c37');
    rect(x-43,y-70,86,21,'#c48a4f');
    pixelText(text,x,y-59,13,'#fff0c3','center');
  }

  function drawPlatform(p) {
    const sx = p.x - cameraX;
    if (sx > W+100 || sx + p.w < -100) return;
    if (p.type === 'ground') {
      rect(sx,p.y,p.w,84,'#65422e');
      rect(sx,p.y,p.w,17,'#6da946');
      rect(sx,p.y+17,p.w,10,'#8b5d37');
      for (let x = Math.floor(Math.max(0,-sx)/32)*32; x < p.w && sx+x < W; x += 32) {
        rect(sx+x,p.y+29,30,20, ((x/32)%2===0)?'#7a4e33':'#70462f');
        rect(sx+x+3,p.y+20,7,5,'#9bc65a');
      }
    } else if (p.type === 'grass') {
      rect(sx,p.y,p.w,p.h,'#6c482e');
      rect(sx,p.y,p.w,9,'#79b34e');
      for(let x=4;x<p.w;x+=18) rect(sx+x,p.y-4,8,4,'#a5d768');
    } else {
      rect(sx,p.y,p.w,p.h,'#7c4d2e');
      rect(sx,p.y,p.w,7,'#c08a50');
      for(let x=8;x<p.w;x+=28) rect(sx+x,p.y+9,20,4,'#9b663b');
    }
  }

  function drawTeacher(x,y) {
    const sx=x-cameraX;
    rect(sx-18,y-50,36,31,'#d3b18a');
    rect(sx-22,y-57,44,16,'#ded8ca');
    rect(sx-17,y-20,34,40,'#6f8b55');
    rect(sx-10,y+19,8,14,'#5c4330'); rect(sx+3,y+19,8,14,'#5c4330');
    rect(sx-11,y-39,6,6,'#33302b'); rect(sx+6,y-39,6,6,'#33302b');
    rect(sx-6,y-29,13,4,'#8c6548');
    rect(sx-25,y-17,8,22,'#d3b18a'); rect(sx+18,y-17,8,22,'#d3b18a');
  }

  function drawRobot(x,y) {
    const sx=x-cameraX;
    rect(sx-20,y-38,40,31,'#d2dadd');
    rect(sx-16,y-34,32,21,'#283f47');
    rect(sx-9,y-28,6,6,'#56d8e7'); rect(sx+5,y-28,6,6,'#56d8e7');
    rect(sx-14,y-6,28,24,'#aeb9bc');
    rect(sx-7,y-46,14,8,'#aeb9bc'); rect(sx-2,y-52,4,6,'#65767a');
    rect(sx-19,y+18,10,5,'#798b8e'); rect(sx+9,y+18,10,5,'#798b8e');
  }

  function drawCharacterPreview(previewCanvas, gender) {
    const pctx = previewCanvas.getContext('2d');
    pctx.imageSmoothingEnabled = false;
    pctx.clearRect(0,0,96,96);
    pctx.fillStyle='#85d3df'; pctx.fillRect(0,0,96,96);
    pctx.fillStyle='#68a84d'; pctx.fillRect(0,72,96,24);
    drawCharacterTo(pctx,31,18,gender,1,0,false);
  }

  function drawCharacterTo(context,x,y,gender,face,walkFrame,jumping) {
    context.save();
    const flip = face < 0;
    context.translate(Math.round(x + (flip ? 34 : 0)), Math.round(y));
    context.scale(flip ? -1 : 1,1);
    const skin='#e3ad79';
    const hair=gender==='female'?'#814c31':'#5e3b2d';
    const shirt='#f2dfb3';
    const overall='#3f7b47';
    const dark='#3d3028';
    const legA = jumping ? -1 : (walkFrame===0 ? 0 : 2);
    const legB = jumping ? 2 : (walkFrame===0 ? 2 : 0);
    const px=(xx,yy,ww,hh,c)=>{context.fillStyle=c;context.fillRect(Math.round(xx),Math.round(yy),Math.round(ww),Math.round(hh));};
    px(6,1,22,8,hair); px(4,7,26,14,hair);
    if(gender==='female'){px(2,9,6,24,hair);px(28,9,6,24,hair);px(27,3,7,9,'#d69b52');}
    else {px(5,0,5,5,hair);px(22,0,6,5,hair);}
    px(8,8,18,16,skin); px(11,13,3,3,dark);px(21,13,3,3,dark);px(15,19,6,2,'#a75c48');
    px(6,24,22,22,shirt); px(10,29,14,21,overall); px(12,28,10,4,'#94bb65');
    px(2,25,6,18,skin); px(28,25,6,18,skin);
    px(9,48+legA,7,7,'#65462f'); px(20,48+legB,7,7,'#65462f');
    px(12,33,3,3,'#d6b23e');px(21,33,3,3,'#d6b23e');
    context.restore();
  }

  function drawPlayer() {
    const walkFrame = Math.floor(frameClock * 8) % 2;
    drawCharacterTo(ctx, player.x-cameraX, player.y, selectedGender, player.face, Math.abs(player.vx)>10?walkFrame:0, !player.onGround);
  }

  function zoneDecorations() {
    // Zone 1 — Measurement Garden
    workbench(550-cameraX, FLOOR, 0);
    signpost(330-cameraX,FLOOR,'มุมวัด');
    crate(735-cameraX,FLOOR,1);
    // Zone 2 — level / shelves
    workbench(1020-cameraX,FLOOR,0);
    rect(1190-cameraX,FLOOR-108,18,108,'#6e472e'); rect(1278-cameraX,FLOOR-108,18,108,'#6e472e');
    [0,1,2].forEach(i=>rect(1190-cameraX,FLOOR-100+i*34,106,10,'#aa7040'));
    rect(1228-cameraX,FLOOR-123,55,10,'#e7bd3e');
    // Zone 3 — fasteners
    signpost(1460-cameraX,FLOOR,'งานยึด'); workbench(1690-cameraX,FLOOR,1); crate(1875-cameraX,FLOOR,1);
    // Zone 4 — wrench table
    workbench(2110-cameraX,FLOOR,2); crate(2295-cameraX,FLOOR,1);
    // Zone 5 — robot / assembly
    workbench(2620-cameraX,FLOOR,2); crate(2790-cameraX,FLOOR,1); crate(2842-cameraX,FLOOR,0.9);
    // Zone 6 — hammer
    workbench(3060-cameraX,FLOOR,3); signpost(3190-cameraX,FLOOR,'ประกอบ');
    // Zone 7 — finishing
    workbench(3510-cameraX,FLOOR,3); crate(3675-cameraX,FLOOR,1); signpost(3420-cameraX,FLOOR,'ตกแต่ง');
    // Final workshop gate
    rect(3920-cameraX,FLOOR-118,18,118,'#6d462e'); rect(4075-cameraX,FLOOR-118,18,118,'#6d462e'); rect(3900-cameraX,FLOOR-125,212,28,'#905b37');
    rect(3908-cameraX,FLOOR-119,196,16,'#c88e4c'); pixelText('WORKSHOP',4006-cameraX,FLOOR-111,14,'#fff0bd','center');
  }

  function drawQuestMarkers() {
    const zone = zones[Math.min(quest, 8)];
    const sx = zone.x - cameraX;
    if (sx > -80 && sx < W+80) {
      const bob = Math.sin(frameClock*5)*4;
      rect(sx-17, 316+bob, 34, 34, '#f1c347');
      rect(sx-13, 320+bob, 26, 26, '#fff1a6');
      pixelText('!',sx,334+bob,24,'#5e4028','center');
    }
  }

  function drawWorld() {
    ctx.clearRect(0,0,W,H);
   // ฉากหลัง Pixel Art
if (backgroundImage.complete && backgroundImage.naturalWidth > 0) {
  ctx.drawImage(
    backgroundImage,
    0,
    0,
    W,
    H
  );
} else {
  // สีสำรองระหว่างรอภาพโหลด
  rect(0, 0, W, H, '#63c6df');
}

    platforms.forEach(drawPlatform);

    // foreground scenery anchored to world
    for(let i=0;i<26;i++) {
      const wx=140+i*155;
      const sx=wx-cameraX;
      if(sx>-20&&sx<W+20) grassTuft(sx,FLOOR,0.9+(i%2)*0.2);
    }
    const flowerColors=['#f8d85f','#ef8dac','#f5f2dc','#6ca3e8'];
    for(let i=0;i<34;i++) {
      const wx=80+i*121;
      const sx=wx-cameraX;
      if(sx>-10&&sx<W+10) flower(sx,FLOOR-4,flowerColors[i%flowerColors.length]);
    }

    zoneDecorations();
    drawTeacher(210,FLOOR-34);
    drawRobot(2540,FLOOR-28);
    drawQuestMarkers();
    drawPlayer();

    // zone title ribbons
    const zoneTitles=[
      [520,'MEASUREMENT GARDEN'],[1480,'FIXING WORKSHOP'],[2440,'ASSEMBLY GROVE'],[3360,'WOODCRAFT CORNER']
    ];
    zoneTitles.forEach(([x,t])=>{
      const sx=x-cameraX;
      if(sx>-300&&sx<W+300) pixelText(t,sx,32,13,'#fff1c2','center');
    });
  }

  function collidePlatforms(oldY) {
    player.onGround = false;
    for (const p of platforms) {
      const withinX = player.x + player.w - 6 > p.x && player.x + 6 < p.x + p.w;
      if (!withinX) continue;
      const top = p.y;
      const oldBottom = oldY + player.h;
      const newBottom = player.y + player.h;
      if (player.vy >= 0 && oldBottom <= top + 6 && newBottom >= top) {
        player.y = top - player.h;
        player.vy = 0;
        player.onGround = true;
        return;
      }
    }
  }

  function update(dt) {
    frameClock += dt;
    if (!started || !dialog.classList.contains('hidden') || !modal.classList.contains('hidden')) return;

    player.vx = (keys.right ? RUN_SPEED : 0) - (keys.left ? RUN_SPEED : 0);
    if (player.vx > 0) player.face = 1;
    if (player.vx < 0) player.face = -1;

    if (jumpQueued && player.onGround) {
      player.vy = -JUMP_SPEED;
      player.onGround = false;
      tone(430,0.05);
    }
    jumpQueued = false;

    const oldY = player.y;
    player.vy += GRAVITY * dt;
    player.x += player.vx * dt;
    player.y += player.vy * dt;
    player.x = Math.max(20,Math.min(WORLD_W-50,player.x));
    collidePlatforms(oldY);

    if (player.y > H + 120) {
      player.x = player.checkpointX;
      player.y = player.checkpointY;
      player.vx = 0;
      player.vy = 0;
      showToast('กลับมาที่จุดปลอดภัยแล้ว');
    }

    cameraX = Math.max(0,Math.min(WORLD_W-W,player.x-320));
  }

  function loop(time) {
    const dt = Math.min(0.033,(time-lastTime)/1000);
    lastTime = time;
    update(dt);
    drawWorld();
    requestAnimationFrame(loop);
  }

  // ---------- Controls ----------
  document.getElementById('femaleBtn').addEventListener('click', () => {
    selectedGender='female';
    document.getElementById('femaleBtn').classList.add('selected');
    document.getElementById('maleBtn').classList.remove('selected');
    document.getElementById('femaleBtn').setAttribute('aria-pressed','true');
    document.getElementById('maleBtn').setAttribute('aria-pressed','false');
  });
  document.getElementById('maleBtn').addEventListener('click', () => {
    selectedGender='male';
    document.getElementById('maleBtn').classList.add('selected');
    document.getElementById('femaleBtn').classList.remove('selected');
    document.getElementById('maleBtn').setAttribute('aria-pressed','true');
    document.getElementById('femaleBtn').setAttribute('aria-pressed','false');
  });
  document.getElementById('startBtn').addEventListener('click', startGame);
  document.getElementById('bookBtn').addEventListener('click', openBook);
  document.getElementById('restartBtn').addEventListener('click', resetGame);
  document.getElementById('soundBtn').addEventListener('click', event => {
    soundOn=!soundOn;
    event.currentTarget.textContent=soundOn?'🔊 เสียง':'🔇 ปิดเสียง';
    if(soundOn) tone(650,0.06);
  });
  document.getElementById('interactBtn').addEventListener('click', interact);
  document.getElementById('jumpBtn').addEventListener('click', () => jumpQueued=true);

  root.addEventListener('keydown', event => {
    if (['INPUT','SELECT','TEXTAREA','BUTTON'].includes(document.activeElement.tagName)) return;
    const k=event.key.toLowerCase();
    if(['arrowleft','arrowright','arrowup','a','d','w',' ','e'].includes(k)) event.preventDefault();
    if(k==='a'||k==='arrowleft') keys.left=true;
    if(k==='d'||k==='arrowright') keys.right=true;
    if(k==='w'||k==='arrowup'||k===' ') jumpQueued=true;
    if(k==='e') interact();
  });
  root.addEventListener('keyup', event => {
    const k=event.key.toLowerCase();
    if(k==='a'||k==='arrowleft') keys.left=false;
    if(k==='d'||k==='arrowright') keys.right=false;
  });

  document.querySelectorAll('[data-move]').forEach(button => {
    const dir=button.dataset.move;
    button.addEventListener('pointerdown', e => { e.preventDefault(); keys[dir]=true; });
    ['pointerup','pointercancel','pointerleave'].forEach(type => button.addEventListener(type, () => keys[dir]=false));
  });

  drawCharacterPreview(document.getElementById('femalePreview'),'female');
  drawCharacterPreview(document.getElementById('malePreview'),'male');
  updateHUD();
  requestAnimationFrame(loop);
})();
