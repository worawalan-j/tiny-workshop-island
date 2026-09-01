(() => {
  const root = document.getElementById('app');
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

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
  let toastTimer = null;

  const keys = {
    left: false,
    right: false
  };

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

  // =========================
  // ภารกิจ
  // =========================

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
    {
      x: 210,
      label: 'ครูไม้'
    },

    {
      x: 640,
      label: 'มุมวัดและตรวจสอบ'
    },

    {
      x: 1120,
      label: 'ชั้นวางเอียง'
    },

    {
      x: 1580,
      label: 'มุมไขควง'
    },

    {
      x: 2070,
      label: 'โต๊ะนอต'
    },

    {
      x: 2540,
      label: 'น้องนอต'
    },

    {
      x: 3020,
      label: 'โต๊ะประกอบ'
    },

    {
      x: 3490,
      label: 'มุมตัดและตกแต่ง'
    },

    {
      x: 3950,
      label: 'ป้ายเวิร์กช็อป'
    }
  ];

  // =========================
  // ข้อมูลเครื่องมือ
  // =========================

  const tools = {
    tape: [
      '📏',
      'ตลับเมตร',
      'เครื่องมือวัด',
      'ใช้วัดความยาวหรือระยะต่าง ๆ',
      'เก็บสายกลับอย่างระมัดระวัง'
    ],

    ruler: [
      '📐',
      'ไม้บรรทัดเหล็ก',
      'เครื่องมือวัด',
      'เหมาะสำหรับวัดระยะสั้นและช่วยกำหนดแนวตรง',
      'ตรวจขอบและสเกลก่อนใช้งาน'
    ],

    square: [
      '◻️',
      'ฉากเหล็ก',
      'เครื่องมือวัดและตรวจสอบ',
      'ใช้ตรวจสอบหรือกำหนดมุมฉาก 90 องศา',
      'วางแนบกับชิ้นงานอย่างมั่นคง'
    ],

    level: [
      '🟩',
      'ระดับน้ำ',
      'เครื่องมือตรวจสอบ',
      'ใช้ตรวจแนวระดับหรือแนวดิ่งของชิ้นงาน',
      'สังเกตตำแหน่งฟองอากาศในหลอดระดับ'
    ],

    phillips: [
      '✚',
      'ไขควงแฉก',
      'เครื่องมือขันและยึด',
      'ใช้กับสกรูที่มีร่องหัวเป็นรูปกากบาท',
      'เลือกขนาดปลายให้เหมาะกับหัวสกรู'
    ],

    flat: [
      '➖',
      'ไขควงปากแบน',
      'เครื่องมือขันและยึด',
      'ใช้กับสกรูที่มีร่องหัวเป็นเส้นตรง',
      'เลือกปลายไขควงให้พอดีกับร่อง'
    ],

    wrench: [
      '🔧',
      'ประแจ',
      'เครื่องมือขันและยึด',
      'ใช้สำหรับขันหรือคลายนอตและโบลต์',
      'เลือกขนาดให้พอดีกับหัวนอต'
    ],

    adjustable: [
      '🔧',
      'ประแจเลื่อน',
      'เครื่องมือขันและยึด',
      'ปรับขนาดปากให้เหมาะกับหัวนอตได้หลายขนาด',
      'ปรับปากให้กระชับกับชิ้นงาน'
    ],

    pliers: [
      '🗜️',
      'คีมปากจิ้งจก',
      'เครื่องมือจับ',
      'ใช้จับ ยึด หรือดัดชิ้นงานบางประเภท',
      'ไม่ควรใช้แทนประแจในงานทั่วไป'
    ],

    longnose: [
      '📎',
      'คีมปากยาว',
      'เครื่องมือจับ',
      'เหมาะสำหรับจับชิ้นส่วนเล็กในพื้นที่แคบ',
      'ใช้แรงพอเหมาะเพื่อไม่ให้ชิ้นงานเสียรูป'
    ],

    clamp: [
      '🗜️',
      'แคลมป์',
      'เครื่องมือยึดชิ้นงาน',
      'ใช้ยึดชิ้นงานให้อยู่กับที่ระหว่างทำงาน',
      'ตรวจให้ชิ้นงานมั่นคงก่อนเริ่มงาน'
    ],

    claw: [
      '🔨',
      'ค้อนหงอน',
      'เครื่องมือตอกและประกอบ',
      'ใช้ในงานตอกและถอนตะปู',
      'ตรวจสภาพเครื่องมือและพื้นที่รอบตัว'
    ],

    rubber: [
      '🔨',
      'ค้อนยาง',
      'เครื่องมือตอกและประกอบ',
      'ใช้เคาะจัดตำแหน่งโดยลดโอกาสเกิดรอยบนพื้นผิว',
      'ใช้แรงให้เหมาะสมกับชิ้นงาน'
    ],

    saw: [
      '🪚',
      'เลื่อยมือ',
      'เครื่องมือตัด',
      'ใช้ตัดวัสดุตามชนิดงานที่เหมาะสม',
      'ควรใช้ภายใต้การดูแลของครูหรือผู้มีความรู้'
    ],

    file: [
      '🧰',
      'ตะไบ',
      'เครื่องมือตกแต่ง',
      'ใช้ตกแต่ง ลดส่วนเกิน หรือปรับพื้นผิววัสดุบางประเภท',
      'ยึดชิ้นงานให้มั่นคงเมื่อจำเป็น'
    ],

    sand: [
      '🟫',
      'กระดาษทราย',
      'เครื่องมือตกแต่ง',
      'ใช้ขัดตกแต่งผิวให้เรียบขึ้น',
      'ใช้อุปกรณ์ป้องกันที่เหมาะสมกับงาน'
    ]
  };

  // =========================
  // พื้นและแท่นกระโดด
  // =========================

  const platforms = [
    {
      x: 0,
      y: FLOOR,
      w: 4200,
      h: 84,
      type: 'ground'
    },

    {
      x: 410,
      y: 388,
      w: 175,
      h: 22,
      type: 'grass'
    },

    {
      x: 890,
      y: 372,
      w: 190,
      h: 22,
      type: 'wood'
    },

    {
      x: 1365,
      y: 398,
      w: 150,
      h: 22,
      type: 'grass'
    },

    {
      x: 1760,
      y: 356,
      w: 185,
      h: 22,
      type: 'wood'
    },

    {
      x: 2240,
      y: 392,
      w: 165,
      h: 22,
      type: 'grass'
    },

    {
      x: 2750,
      y: 365,
      w: 195,
      h: 22,
      type: 'wood'
    },

    {
      x: 3260,
      y: 388,
      w: 180,
      h: 22,
      type: 'grass'
    },

    {
      x: 3715,
      y: 350,
      w: 185,
      h: 22,
      type: 'wood'
    }
  ];

  // =========================
  // เสียง
  // =========================

  function tone(
    freq = 620,
    duration = 0.08
  ) {
    if (!soundOn) return;

    try {
      audioCtx =
        audioCtx ||
        new (
          window.AudioContext ||
          window.webkitAudioContext
        )();

      const osc =
        audioCtx.createOscillator();

      const gain =
        audioCtx.createGain();

      osc.type = 'square';

      osc.frequency.value =
        freq;

      gain.gain.value =
        0.024;

      osc.connect(gain);

      gain.connect(
        audioCtx.destination
      );

      osc.start();

      gain.gain
        .exponentialRampToValueAtTime(
          0.001,
          audioCtx.currentTime +
          duration
        );

      osc.stop(
        audioCtx.currentTime +
        duration
      );

    } catch (_) {}
  }

  // =========================
  // HUD
  // =========================

  function updateHUD() {
    missionText.textContent =
      objectives[
        Math.min(
          quest,
          objectives.length - 1
        )
      ];

    progressFill.style.width =
      `${
        (
          Math.min(
            quest,
            9
          ) /
          9
        ) *
        100
      }%`;
  }

  function showToast(
    message
  ) {
    clearTimeout(
      toastTimer
    );

    toast.textContent =
      message;

    toast.classList
      .remove(
        'hidden'
      );

    toastTimer =
      setTimeout(
        () =>
          toast.classList
            .add(
              'hidden'
            ),
        1500
      );
  }

  // =========================
  // กล่องบทสนทนา
  // =========================

  function closeDialog() {
    dialog.classList
      .add(
        'hidden'
      );

    choices.innerHTML =
      '';
  }

  function showDialog(
    who,
    html,
    options = []
  ) {
    speaker.textContent =
      who;

    dialogText.innerHTML =
      html;

    choices.innerHTML =
      '';

    options.forEach(
      option => {

        const button =
          document.createElement(
            'button'
          );

        button.type =
          'button';

        button.className =
          'choice';

        button.textContent =
          option.label;

        button.addEventListener(
          'click',
          option.action
        );

        choices.appendChild(
          button
        );
      }
    );

    dialog.classList
      .remove(
        'hidden'
      );
  }

  // =========================
  // Panel
  // =========================

  function showPanel(
    html
  ) {
    modal.innerHTML =
      `
      <div class="panel">
        ${html}
      </div>
      `;

    modal.classList
      .remove(
        'hidden'
      );
  }

  function hidePanel() {
    modal.classList
      .add(
        'hidden'
      );

    modal.innerHTML =
      '';
  }

  // =========================
  // การ์ดเครื่องมือ
  // =========================

  function learn(
    ids
  ) {
    ids.forEach(
      id =>
        learned.add(
          id
        )
    );

    tone(
      870,
      0.11
    );
  }

  function showCards(
    ids,
    next
  ) {
    learn(
      ids
    );

    const cards =
      ids.map(
        id => {

          const t =
            tools[id];

          return `
          <article class="tool-card">

            <div class="tool-icon">
              ${t[0]}
            </div>

            <b>
              ${t[1]}
            </b>

            <small>
              ${t[2]}
              <br>

              ${t[3]}

              <br>

              <b>
                ข้อควรรู้:
              </b>

              ${t[4]}

            </small>

          </article>
          `;
        }
      ).join('');

    showPanel(
      `
      <div class="panel-head">

        <div>

          <span class="new-badge">
            ✨ เครื่องมือใหม่!
          </span>

          <br>

          <b>
            ได้รับการ์ดความรู้
          </b>

        </div>

      </div>

      <div class="tool-grid">
        ${cards}
      </div>

      <div
        style="
          text-align:right;
          margin-top:12px
        "
      >

        <button
          id="cardNext"
          class="pixel-button"
          type="button"
        >
          ไปต่อ →
        </button>

      </div>
      `
    );

    document
      .getElementById(
        'cardNext'
      )
      .addEventListener(
        'click',
        () => {

          hidePanel();

          next();
        }
      );
  }

  // =========================
  // ไปภารกิจต่อไป
  // =========================

  function advance() {

    quest += 1;

    const nextZone =
      zones[
        Math.min(
          quest,
          8
        )
      ];

    player.checkpointX =
      Math.max(
        70,
        nextZone.x -
        120
      );

    player.checkpointY =
      FLOOR -
      player.h;

    updateHUD();

    closeDialog();

    showToast(
      `ภารกิจใหม่: ${objectives[quest]}`
    );

    tone(
      720,
      0.08
    );
  }

  // =========================
  // ระบบคำถาม
  // =========================

  function ask(
    who,
    html,
    optionLabels,
    correctIndex,
    hint,
    cardIds,
    after = advance
  ) {

    showDialog(
      who,
      html,

      optionLabels.map(
        (
          label,
          index
        ) => ({

          label,

          action: () => {

            if (
              index ===
              correctIndex
            ) {

              if (
                !wrong[
                  quest
                ]
              ) {
                score +=
                  10;
              }

              closeDialog();

              showCards(
                cardIds,
                after
              );

            } else {

              wrong[
                quest
              ] = true;

              tone(
                180,
                0.13
              );

              showDialog(
                'น้องนอต',

                `
                ยังไม่ใช่นะ 🤔
                <br>
                ${hint}
                `,

                [
                  {
                    label:
                      'ลองอีกครั้ง',

                    action:
                      () =>
                        ask(
                          who,
                          html,
                          optionLabels,
                          correctIndex,
                          hint,
                          cardIds,
                          after
                        )
                  }
                ]
              );
            }
          }
        })
      )
    );
  }

  // =========================
  // Intro
  // =========================

  function intro() {

    showDialog(

      'ครูไม้',

      `
      สวัสดี ${playerName}!

      วันนี้เวิร์กช็อปจะเปิดแล้ว

      แต่เมื่อคืนลมแรง
      ทำให้อุปกรณ์หลายจุด
      หลวมและเอียงไปหมด
      `,

      [
        {
          label:
            'เดี๋ยวฉันช่วยเอง!',

          action:
            advance
        },

        {
          label:
            'ฉันยังไม่ค่อยรู้จักเครื่องมือเลย',

          action:
            () =>

              showDialog(

                'ครูไม้',

                `
                ไม่เป็นไร

                เราจะเรียนรู้
                ไปพร้อมกับ
                การทำภารกิจนี่แหละ
                `,

                [
                  {
                    label:
                      'เริ่มกันเลย!',

                    action:
                      advance
                  }
                ]
              )
        }
      ]
    );
  }

  // =========================
  // ภารกิจ 1
  // =========================

  function questMeasure() {

    ask(

      'ครูไม้',

      `
      ป้ายไม้หลวมแล้ว

      ก่อนซ่อม
      เราต้องรู้ขนาดของป้ายก่อน

      <br>

      <b>
        ควรเลือกเครื่องมือใด?
      </b>
      `,

      [
        '📏 ตลับเมตร',
        '🔨 ค้อนหงอน',
        '🗜️ คีมปากจิ้งจก'
      ],

      0,

      `
      มองหาเครื่องมือ
      ที่ออกแบบมาสำหรับวัดระยะ
      `,

      [
        'tape',
        'ruler'
      ],

      () => {

        showPanel(
          `
          <div class="panel-head">
            <b>
              Mini Game — วัดป้ายไม้
            </b>
          </div>

          <p>
            เลื่อนปลายตลับเมตร
            จากจุด A
            ไปให้เกือบถึงจุด B
          </p>

          <div
            style="
              border:4px dashed #9b7a55;
              background:#f5e4bc;
              padding:12px
            "
          >

            <div
              style="
                display:flex;
                justify-content:space-between
              "
            >

              <b>A</b>
              <b>B</b>

            </div>

            <input
              id="measure"
              type="range"
              min="0"
              max="100"
              value="18"
              style="
                width:100%;
                margin:14px 0;
                accent-color:#6fa94f
              "
            >

            <div
              id="measureMsg"
              class="hint"
            >
              ค่อย ๆ เลื่อนไปทาง B
            </div>

          </div>

          <button
            id="measureCheck"
            class="pixel-button"
            type="button"
            style="
              margin-top:10px
            "
          >
            ยืนยันการวัด
          </button>
          `
        );

        document
          .getElementById(
            'measureCheck'
          )
          .addEventListener(
            'click',
            () => {

              const value =
                Number(
                  document
                    .getElementById(
                      'measure'
                    )
                    .value
                );

              if (
                value >=
                88
              ) {

                hidePanel();

                advance();

              } else {

                document
                  .getElementById(
                    'measureMsg'
                  )
                  .textContent =
                    'ยังไม่ถึงปลายป้าย ลองเลื่อนไปทาง B อีกนิด';
              }
            }
          );
      }
    );
  }

  // =========================
  // ภารกิจ 2
  // =========================

  function questLevel() {

    ask(

      'น้องนอต',

      `
      กล่องบนชั้นวาง
      ไหลไปด้านเดียวเลย!

      <br>

      <b>
        ควรใช้อะไรตรวจว่า
        ชั้นวางอยู่ในแนวระดับ?
      </b>
      `,

      [
        '🟩 ระดับน้ำ',
        '🔧 ประแจ',
        '📎 คีมปากยาว'
      ],

      0,

      `
      เครื่องมือนี้
      มีหลอดสำหรับสังเกต
      ตำแหน่งฟองอากาศ
      `,

      [
        'level',
        'square'
      ]
    );
  }

  // =========================
  // ภารกิจ 3
  // =========================

  function questScrewdriver() {

    ask(

      'ครูไม้',

      `
      สกรูตรงบานพับ
      มีร่องหัวเป็นรูปกากบาท

      <br>

      <b>
        ควรเลือกเครื่องมือใด?
      </b>
      `,

      [
        '✚ ไขควงแฉก',
        '➖ ไขควงปากแบน',
        '🔧 ประแจ'
      ],

      0,

      `
      รูปร่างของปลายไขควง
      ควรตรงกับ
      ร่องหัวสกรู
      `,

      [
        'phillips',
        'flat'
      ]
    );
  }

  // =========================
  // ภารกิจ 4
  // =========================

  function questWrench() {

    ask(

      'ครูไม้',

      `
      หัวนอตที่ขาโต๊ะ
      คลายออก

      <br>

      <b>
        เครื่องมือใดเหมาะ
        สำหรับขันหรือคลายนอต?
      </b>
      `,

      [
        '🔧 ประแจ',
        '📎 คีมปากยาว',
        '🔨 ค้อนยาง'
      ],

      0,

      `
      เลือกเครื่องมือ
      ที่ออกแบบมา
      ให้จับหัวนอตได้พอดี
      `,

      [
        'wrench',
        'adjustable'
      ]
    );
  }

  // =========================
  // ภารกิจ 5
  // =========================

  function questPliers() {

    ask(

      'น้องนอต',

      `
      แหวนรองชิ้นเล็ก
      ตกอยู่ในซอกแคบ

      มือเอื้อมไม่ถึงเลย!

      <br>

      <b>
        ควรเลือกเครื่องมือใด?
      </b>
      `,

      [
        '📎 คีมปากยาว',
        '📏 ตลับเมตร',
        '🔨 ค้อนหงอน'
      ],

      0,

      `
      เครื่องมือ
      ที่มีปลายเรียวยาว

      เหมาะกับ
      บริเวณแคบ
      `,

      [
        'longnose',
        'pliers',
        'clamp'
      ]
    );
  }

  // =========================
  // ภารกิจ 6
  // =========================

  function questHammer() {

    ask(

      'ครูไม้',

      `
      เราต้องเคาะชิ้นไม้
      ให้เข้าที่

      แต่ต้องการลดโอกาส
      เกิดรอยบนพื้นผิว

      <br>

      <b>
        ควรเลือกอะไร?
      </b>
      `,

      [
        '🔨 ค้อนยาง',
        '🔨 ค้อนหงอน',
        '🔧 ประแจ'
      ],

      0,

      `
      เลือกค้อน
      ที่มีผิวสัมผัสนุ่มกว่า
      ค้อนโลหะ
      `,

      [
        'rubber',
        'claw'
      ]
    );
  }

  // =========================
  // ภารกิจ 7
  // =========================

  function questFinishing() {

    showPanel(
      `
      <div class="panel-head">

        <b>
          🪚 มุมตัดและตกแต่ง
        </b>

      </div>

      <p>
        จับคู่เครื่องมือ
        กับหน้าที่ให้ถูกต้อง
      </p>

      <label>
        <b>
          เลื่อยมือ
        </b>
      </label>

      <select
        id="matchSaw"
        class="name-input"
      >

        <option value="">
          เลือกหน้าที่
        </option>

        <option value="saw">
          ตัดวัสดุตามชนิดงานที่เหมาะสม
        </option>

        <option value="file">
          ปรับส่วนเกินหรือพื้นผิว
        </option>

        <option value="sand">
          ขัดผิวให้เรียบขึ้น
        </option>

      </select>

      <br><br>

      <label>
        <b>
          ตะไบ
        </b>
      </label>

      <select
        id="matchFile"
        class="name-input"
      >

        <option value="">
          เลือกหน้าที่
        </option>

        <option value="sand">
          ขัดผิวให้เรียบขึ้น
        </option>

        <option value="file">
          ปรับส่วนเกินหรือพื้นผิว
        </option>

        <option value="saw">
          ตัดวัสดุตามชนิดงานที่เหมาะสม
        </option>

      </select>

      <br><br>

      <label>
        <b>
          กระดาษทราย
        </b>
      </label>

      <select
        id="matchSand"
        class="name-input"
      >

        <option value="">
          เลือกหน้าที่
        </option>

        <option value="file">
          ปรับส่วนเกินหรือพื้นผิว
        </option>

        <option value="saw">
          ตัดวัสดุตามชนิดงานที่เหมาะสม
        </option>

        <option value="sand">
          ขัดผิวให้เรียบขึ้น
        </option>

      </select>

      <p
        id="matchMsg"
        class="hint"
      >
        เครื่องมือที่อาจก่อให้เกิดอันตราย
        ควรใช้ภายใต้การดูแลของครู
        หรือผู้มีความรู้
      </p>

      <button
        id="matchCheck"
        class="pixel-button"
        type="button"
      >
        ตรวจคำตอบ
      </button>
      `
    );

    document
      .getElementById(
        'matchCheck'
      )
      .addEventListener(
        'click',
        () => {

          const ok =

            document
              .getElementById(
                'matchSaw'
              )
              .value ===
            'saw'

            &&

            document
              .getElementById(
                'matchFile'
              )
              .value ===
            'file'

            &&

            document
              .getElementById(
                'matchSand'
              )
              .value ===
            'sand';

          if (
            ok
          ) {

            if (
              !wrong[
                quest
              ]
            ) {
              score +=
                10;
            }

            hidePanel();

            showCards(
              [
                'saw',
                'file',
                'sand'
              ],
              advance
            );

          } else {

            wrong[
              quest
            ] = true;

            document
              .getElementById(
                'matchMsg'
              )
              .textContent =
                'ยังมีบางคู่สลับกันอยู่ ลองดูคำว่า ตัด / ปรับผิว / ขัดผิว อีกครั้ง';

            tone(
              180,
              0.13
            );
          }
        }
      );
  }

  // =========================
  // Final
  // =========================

  function finalQuest() {

    ask(

      'ครูไม้',

      `
      เกือบพร้อม
      เปิดเวิร์กช็อปแล้ว
      ${playerName}!

      <br>

      <b>
        ลำดับใดเหมาะสมที่สุด
        ก่อนติดป้าย?
      </b>
      `,

      [
        'วัดตำแหน่ง → ตรวจแนว → เลือกเครื่องมือให้เหมาะ → ตรวจความเรียบร้อย',

        'ขันก่อน → ค่อยวัด → ถ้าเอียงค่อยแก้',

        'เคาะก่อน → แล้วค่อยตรวจแนว'
      ],

      0,

      `
      งานช่างที่เป็นระบบ
      ควรเริ่มจาก
      การวัดและตรวจสอบก่อน
      `,

      [],

      finishGame
    );
  }

  // =========================
  // จบเกม
  // =========================

  function finishGame() {

    quest = 9;

    updateHUD();

    tone(
      980,
      0.16
    );

    const stars =
      score >= 70

        ? '★★★'

        : score >= 50

          ? '★★☆'

          : '★☆☆';

    showPanel(
      `
      <div
        style="
          text-align:center
        "
      >

        <h2>
          🎉 ภารกิจสำเร็จ!
        </h2>

        <div
          style="
            font-size:2rem;
            color:#b27b1f;
            letter-spacing:6px
          "
        >
          ${stars}
        </div>

        <p>

          <b>
            ${playerName}
          </b>

          ช่วยเปิดเวิร์กช็อป
          ได้สำเร็จ

        </p>

        <p>

          <b>
            คะแนน ${score}/80
          </b>

          ·

          เรียนรู้เครื่องมือ
          ${learned.size}
          ชนิด

        </p>

        <p>
          ครูไม้:
          “งานช่างเริ่มจาก
          การสังเกต วัด
          และเลือกเครื่องมือ
          ให้เหมาะกับงาน”
        </p>

        <button
          id="playAgain"
          class="pixel-button primary"
          type="button"
        >
          เล่นอีกครั้ง
        </button>

      </div>
      `
    );

    document
      .getElementById(
        'playAgain'
      )
      .addEventListener(
        'click',
        resetGame
      );
  }

  // =========================
  // สมุดเครื่องมือ
  // =========================

  function openBook() {

    const ids =
      [
        ...learned
      ];

    const cards =
      ids.length

        ? ids.map(
            id => {

              const t =
                tools[id];

              return `
              <article class="tool-card">

                <div class="tool-icon">
                  ${t[0]}
                </div>

                <b>
                  ${t[1]}
                </b>

                <small>

                  ${t[2]}

                  <br>

                  ${t[3]}

                  <br>

                  <b>
                    ข้อควรรู้:
                  </b>

                  ${t[4]}

                </small>

              </article>
              `;
            }
          ).join('')

        : `
          <p>
            ยังไม่มีการ์ดเครื่องมือ

            ลองออกสำรวจ
            และทำภารกิจก่อนนะ
          </p>
        `;

    showPanel(
      `
      <div class="panel-head">

        <b>
          📘 สมุดเครื่องมือ
          (${ids.length}/16)
        </b>

        <button
          id="closeBook"
          class="pixel-button small"
          type="button"
        >
          ปิด
        </button>

      </div>

      <div class="tool-grid">
        ${cards}
      </div>
      `
    );

    document
      .getElementById(
        'closeBook'
      )
      .addEventListener(
        'click',
        hidePanel
      );
  }

  // =========================
  // กดสำรวจ
  // =========================

  function interact() {

    if (
      !started
    ) {
      return;
    }

    if (
      !dialog.classList
        .contains(
          'hidden'
        )
    ) {
      return;
    }

    if (
      !modal.classList
        .contains(
          'hidden'
        )
    ) {
      return;
    }

    const zone =
      zones[
        Math.min(
          quest,
          8
        )
      ];

    if (
      Math.abs(
        player.x -
        zone.x
      ) >
      105
    ) {

      showToast(
        `เดินเข้าใกล้ ${zone.label} ก่อน`
      );

      return;
    }

    if (
      quest === 0
    ) {
      intro();
    }

    else if (
      quest === 1
    ) {
      questMeasure();
    }

    else if (
      quest === 2
    ) {
      questLevel();
    }

    else if (
      quest === 3
    ) {
      questScrewdriver();
    }

    else if (
      quest === 4
    ) {
      questWrench();
    }

    else if (
      quest === 5
    ) {
      questPliers();
    }

    else if (
      quest === 6
    ) {
      questHammer();
    }

    else if (
      quest === 7
    ) {
      questFinishing();
    }

    else if (
      quest === 8
    ) {
      finalQuest();
    }
  }

  // =========================
  // Start
  // =========================

  function startGame() {

    const nameInput =
      document.getElementById(
        'playerName'
      );

    const hint =
      document.getElementById(
        'nameHint'
      );

    const name =
      nameInput.value
        .trim();

    if (
      !name
    ) {

      hint.textContent =
        'กรุณาตั้งชื่อตัวละครก่อนเริ่มเกม';

      nameInput.focus();

      return;
    }

    playerName =
      name.slice(
        0,
        12
      );

    started =
      true;

    startScreen.classList
      .add(
        'hidden'
      );

    showToast(
      `ยินดีต้อนรับ ${playerName}!`
    );

    updateHUD();

    root.focus();
  }

  // =========================
  // Reset
  // =========================

  function resetGame() {

    quest =
      0;

    score =
      0;

    wrong =
      {};

    learned =
      new Set();

    started =
      false;

    cameraX =
      0;

    player.x =
      105;

    player.y =
      FLOOR -
      player.h;

    player.vx =
      0;

    player.vy =
      0;

    player.onGround =
      true;

    player.face =
      1;

    player.checkpointX =
      105;

    player.checkpointY =
      FLOOR -
      player.h;

    closeDialog();

    hidePanel();

    startScreen.classList
      .remove(
        'hidden'
      );

    updateHUD();
  }

  // ==================================================
  // ส่วนวาดภาพ
  // ==================================================

  function rect(
    x,
    y,
    w,
    h,
    color
  ) {

    ctx.fillStyle =
      color;

    ctx.fillRect(
      Math.round(x),
      Math.round(y),
      Math.round(w),
      Math.round(h)
    );
  }

  function pixelText(
    text,
    x,
    y,
    size = 14,
    color = '#fff',
    align = 'left'
  ) {

    ctx.save();

    ctx.font =
      `bold ${size}px Tahoma, Arial, sans-serif`;

    ctx.textAlign =
      align;

    ctx.textBaseline =
      'middle';

    ctx.lineWidth =
      4;

    ctx.strokeStyle =
      '#5b3d27';

    ctx.strokeText(
      text,
      x,
      y
    );

    ctx.fillStyle =
      color;

    ctx.fillText(
      text,
      x,
      y
    );

    ctx.restore();
  }

  // =========================
  // เมฆ
  // =========================

  function cloud(
    x,
    y,
    scale = 1
  ) {

    const c =
      '#fff3cd';

    rect(
      x,
      y,
      55 * scale,
      12 * scale,
      c
    );

    rect(
      x + 12 * scale,
      y - 9 * scale,
      34 * scale,
      13 * scale,
      c
    );

    rect(
      x + 29 * scale,
      y - 4 * scale,
      43 * scale,
      16 * scale,
      c
    );
  }

  // =========================
  // ภูเขา
  // =========================

  function drawMountainLayer(
    offset,
    color,
    baseY,
    peakHeight,
    spacing
  ) {

    ctx.fillStyle =
      color;

    ctx.beginPath();

    ctx.moveTo(
      0,
      H
    );

    const start =
      -(
        (
          offset %
          spacing
        ) +
        spacing
      );

    for (
      let x = start;
      x < W + spacing;
      x += spacing
    ) {

      ctx.lineTo(
        x,
        baseY
      );

      ctx.lineTo(
        x +
        spacing * 0.5,

        baseY -
        peakHeight
      );

      ctx.lineTo(
        x +
        spacing,

        baseY
      );
    }

    ctx.lineTo(
      W,
      H
    );

    ctx.closePath();

    ctx.fill();
  }

  // =========================
  // ต้นสน
  // =========================

  function pine(
    x,
    y,
    scale,
    colors
  ) {

    rect(
      x - 3 * scale,
      y - 38 * scale,
      6 * scale,
      38 * scale,
      '#66452f'
    );

    rect(
      x - 21 * scale,
      y - 34 * scale,
      42 * scale,
      11 * scale,
      colors[0]
    );

    rect(
      x - 17 * scale,
      y - 47 * scale,
      34 * scale,
      13 * scale,
      colors[1]
    );

    rect(
      x - 12 * scale,
      y - 59 * scale,
      24 * scale,
      13 * scale,
      colors[2]
    );
  }

  // =========================
  // ต้นไม้ใหญ่
  // =========================

  function broadTree(
    x,
    y,
    scale = 1
  ) {

    rect(
      x - 8 * scale,
      y - 65 * scale,
      16 * scale,
      65 * scale,
      '#70482f'
    );

    rect(
      x - 34 * scale,
      y - 92 * scale,
      68 * scale,
      44 * scale,
      '#1e6549'
    );

    rect(
      x - 50 * scale,
      y - 73 * scale,
      40 * scale,
      34 * scale,
      '#2c7d50'
    );

    rect(
      x + 6 * scale,
      y - 80 * scale,
      46 * scale,
      36 * scale,
      '#3d9257'
    );

    rect(
      x - 23 * scale,
      y - 102 * scale,
      35 * scale,
      22 * scale,
      '#4ca663'
    );
  }

  // =========================
  // หญ้า
  // =========================

  function grassTuft(
    x,
    y,
    scale = 1
  ) {

    rect(
      x,
      y - 7 * scale,
      3 * scale,
      7 * scale,
      '#3c8a4f'
    );

    rect(
      x - 4 * scale,
      y - 5 * scale,
      3 * scale,
      5 * scale,
      '#5ca94f'
    );

    rect(
      x + 4 * scale,
      y - 5 * scale,
      3 * scale,
      5 * scale,
      '#5ca94f'
    );
  }

  // =========================
  // ดอกไม้
  // =========================

  function flower(
    x,
    y,
    color
  ) {

    rect(
      x,
      y - 6,
      2,
      6,
      '#45894d'
    );

    rect(
      x - 2,
      y - 9,
      3,
      3,
      color
    );

    rect(
      x + 1,
      y - 9,
      3,
      3,
      color
    );

    rect(
      x,
      y - 11,
      3,
      3,
      color
    );
  }

  // =========================
  // พื้น
  // =========================

  function drawPlatform(
    p
  ) {

    const x =
      p.x -
      cameraX;

    if (
      x +
      p.w <
      -30
      ||
      x >
      W + 30
    ) {
      return;
    }

    if (
      p.type ===
      'ground'
      ||
      p.type ===
      'grass'
    ) {

      rect(
        x,
        p.y,
        p.w,
        p.h,
        '#6d482f'
      );

      rect(
        x,
        p.y,
        p.w,
        9,
        '#73b64e'
      );

      rect(
        x,
        p.y + 9,
        p.w,
        7,
        '#9ad45f'
      );

      for (
        let i = 0;
        i < p.w;
        i += 32
      ) {

        rect(
          x + i,
          p.y + 18,
          28,
          18,
          '#7e5336'
        );

        rect(
          x + i + 6,
          p.y + 23,
          9,
          6,
          '#94623d'
        );
      }

    } else {

      rect(
        x,
        p.y,
        p.w,
        p.h,
        '#805232'
      );

      rect(
        x,
        p.y,
        p.w,
        7,
        '#bd8246'
      );

      for (
        let i = 8;
        i < p.w;
        i += 34
      ) {

        rect(
          x + i,
          p.y + 8,
          4,
          p.h - 8,
          '#5f3d29'
        );
      }
    }
  }

  // =========================
  // กล่องไม้
  // =========================

  function crate(
    x,
    y,
    scale = 1
  ) {

    rect(
      x - 20 * scale,
      y - 39 * scale,
      40 * scale,
      39 * scale,
      '#8d5a35'
    );

    rect(
      x - 16 * scale,
      y - 35 * scale,
      32 * scale,
      5 * scale,
      '#c1874d'
    );

    rect(
      x - 16 * scale,
      y - 9 * scale,
      32 * scale,
      5 * scale,
      '#c1874d'
    );

    rect(
      x - 3 * scale,
      y - 35 * scale,
      6 * scale,
      31 * scale,
      '#67432c'
    );
  }

  // =========================
  // โต๊ะ
  // =========================

  function workbench(
    x,
    y
  ) {

    rect(
      x - 43,
      y - 48,
      86,
      12,
      '#b77942'
    );

    rect(
      x - 37,
      y - 36,
      8,
      36,
      '#70462e'
    );

    rect(
      x + 29,
      y - 36,
      8,
      36,
      '#70462e'
    );

    rect(
      x - 28,
      y - 68,
      56,
      20,
      '#9b653a'
    );

    rect(
      x - 24,
      y - 64,
      48,
      5,
      '#d19a59'
    );
  }

  // =========================
  // ป้าย
  // =========================

  function signpost(
    x,
    y,
    label
  ) {

    rect(
      x - 4,
      y - 63,
      8,
      63,
      '#69452f'
    );

    rect(
      x - 44,
      y - 69,
      88,
      29,
      '#a96d3b'
    );

    rect(
      x - 39,
      y - 65,
      78,
      20,
      '#ce9858'
    );

    pixelText(
      label,
      x,
      y - 55,
      12,
      '#fff0bd',
      'center'
    );
  }

  // =========================
  // ครูไม้
  // =========================

  function drawTeacher(
    x,
    y
  ) {

    const sx =
      x -
      cameraX;

    rect(
      sx - 16,
      y - 48,
      32,
      30,
      '#d3b087'
    );

    rect(
      sx - 19,
      y - 55,
      38,
      15,
      '#ded8cb'
    );

    rect(
      sx - 14,
      y - 18,
      28,
      38,
      '#6f8b55'
    );

    rect(
      sx - 9,
      y + 20,
      8,
      13,
      '#5e4531'
    );

    rect(
      sx + 2,
      y + 20,
      8,
      13,
      '#5e4531'
    );

    rect(
      sx - 10,
      y - 37,
      6,
      6,
      '#38332d'
    );

    rect(
      sx + 5,
      y - 37,
      6,
      6,
      '#38332d'
    );

    rect(
      sx - 7,
      y - 29,
      14,
      4,
      '#8c6548'
    );

    rect(
      sx - 25,
      y - 17,
      8,
      22,
      '#d3b18a'
    );

    rect(
      sx + 18,
      y - 17,
      8,
      22,
      '#d3b18a'
    );
  }

  // =========================
  // น้องนอต
  // =========================

  function drawRobot(
    x,
    y
  ) {

    const sx =
      x -
      cameraX;

    rect(
      sx - 20,
      y - 38,
      40,
      31,
      '#d2dadd'
    );

    rect(
      sx - 16,
      y - 34,
      32,
      21,
      '#283f47'
    );

    rect(
      sx - 9,
      y - 28,
      6,
      6,
      '#56d8e7'
    );

    rect(
      sx + 5,
      y - 28,
      6,
      6,
      '#56d8e7'
    );

    rect(
      sx - 14,
      y - 6,
      28,
      24,
      '#aeb9bc'
    );

    rect(
      sx - 7,
      y - 46,
      14,
      8,
      '#aeb9bc'
    );

    rect(
      sx - 2,
      y - 52,
      4,
      6,
      '#65767a'
    );

    rect(
      sx - 19,
      y + 18,
      10,
      5,
      '#798b8e'
    );

    rect(
      sx + 9,
      y + 18,
      10,
      5,
      '#798b8e'
    );
  }

  // =========================
  // ตัวละครชาย / หญิง
  // =========================

  function drawCharacterTo(
    context,
    x,
    y,
    gender,
    face,
    walkFrame,
    jumping
  ) {

    context.save();

    const flip =
      face < 0;

    context.translate(
      Math.round(
        x +
        (
          flip
            ? 34
            : 0
        )
      ),

      Math.round(
        y
      )
    );

    context.scale(
      flip
        ? -1
        : 1,

      1
    );

    const skin =
      '#e3ad79';

    const hair =
      gender ===
      'female'

        ? '#814c31'

        : '#5e3b2d';

    const shirt =
      '#f2dfb3';

    const overall =
      '#3f7b47';

    const dark =
      '#3d3028';

    const legA =
      jumping

        ? -1

        : walkFrame === 0

          ? 0

          : 2;

    const legB =
      jumping

        ? 2

        : walkFrame === 0

          ? 2

          : 0;

    const p =
      (
        xx,
        yy,
        ww,
        hh,
        c
      ) => {

        context.fillStyle =
          c;

        context.fillRect(
          Math.round(
            xx
          ),

          Math.round(
            yy
          ),

          Math.round(
            ww
          ),

          Math.round(
            hh
          )
        );
      };

    // ผม
    p(
      6,
      1,
      22,
      8,
      hair
    );

    p(
      4,
      7,
      26,
      14,
      hair
    );

    if (
      gender ===
      'female'
    ) {

      p(
        2,
        9,
        6,
        24,
        hair
      );

      p(
        28,
        9,
        6,
        24,
        hair
      );

      p(
        27,
        3,
        7,
        9,
        '#d69b52'
      );

    } else {

      p(
        5,
        0,
        5,
        5,
        hair
      );

      p(
        22,
        0,
        6,
        5,
        hair
      );
    }

    // หน้า
    p(
      8,
      8,
      18,
      16,
      skin
    );

    // ตา
    p(
      11,
      13,
      3,
      3,
      dark
    );

    p(
      21,
      13,
      3,
      3,
      dark
    );

    // ปาก
    p(
      15,
      19,
      6,
      2,
      '#a75c48'
    );

    // เสื้อ
    p(
      6,
      24,
      22,
      22,
      shirt
    );

    // เอี๊ยม
    p(
      10,
      29,
      14,
      21,
      overall
    );

    p(
      12,
      28,
      10,
      4,
      '#94bb65'
    );

    // แขน
    p(
      2,
      25,
      6,
      18,
      skin
    );

    p(
      28,
      25,
      6,
      18,
      skin
    );

    // รองเท้า
    p(
      9,
      48 + legA,
      7,
      7,
      '#65462f'
    );

    p(
      20,
      48 + legB,
      7,
      7,
      '#65462f'
    );

    // กระดุม
    p(
      12,
      33,
      3,
      3,
      '#d6b23e'
    );

    p(
      21,
      33,
      3,
      3,
      '#d6b23e'
    );

    context.restore();
  }

  // =========================
  // ตัวอย่างตอนเลือกตัวละคร
  // =========================

  function drawCharacterPreview(
    previewCanvas,
    gender
  ) {

    const pctx =
      previewCanvas
        .getContext(
          '2d'
        );

    pctx.imageSmoothingEnabled =
      false;

    pctx.clearRect(
      0,
      0,
      96,
      96
    );

    pctx.fillStyle =
      '#85d3df';

    pctx.fillRect(
      0,
      0,
      96,
      96
    );

    pctx.fillStyle =
      '#68a84d';

    pctx.fillRect(
      0,
      72,
      96,
      24
    );

    drawCharacterTo(
      pctx,
      31,
      18,
      gender,
      1,
      0,
      false
    );
  }

  // =========================
  // ตัวผู้เล่น
  // =========================

  function drawPlayer() {

    const walkFrame =
      Math.floor(
        frameClock *
        8
      ) %
      2;

    drawCharacterTo(

      ctx,

      player.x -
      cameraX,

      player.y,

      selectedGender,

      player.face,

      Math.abs(
        player.vx
      ) >
      10

        ? walkFrame

        : 0,

      !player.onGround
    );
  }

  // =========================
  // ของตกแต่งตามด่าน
  // =========================

  function zoneDecorations() {

    // โซนวัด
    workbench(
      550 -
      cameraX,

      FLOOR
    );

    signpost(
      330 -
      cameraX,

      FLOOR,

      'มุมวัด'
    );

    crate(
      735 -
      cameraX,

      FLOOR,
      1
    );

    // ชั้นวาง
    workbench(
      1020 -
      cameraX,

      FLOOR
    );

    rect(
      1190 -
      cameraX,

      FLOOR - 108,

      18,
      108,

      '#6e472e'
    );

    rect(
      1278 -
      cameraX,

      FLOOR - 108,

      18,
      108,

      '#6e472e'
    );

    [
      0,
      1,
      2
    ]
      .forEach(
        i =>
          rect(

            1190 -
            cameraX,

            FLOOR -
            100 +
            i * 34,

            106,
            10,

            '#aa7040'
          )
      );

    rect(
      1228 -
      cameraX,

      FLOOR -
      123,

      55,
      10,

      '#e7bd3e'
    );

    // งานยึด
    signpost(
      1460 -
      cameraX,

      FLOOR,

      'งานยึด'
    );

    workbench(
      1690 -
      cameraX,

      FLOOR
    );

    crate(
      1875 -
      cameraX,

      FLOOR,
      1
    );

    // ประแจ
    workbench(
      2110 -
      cameraX,

      FLOOR
    );

    crate(
      2295 -
      cameraX,

      FLOOR,
      1
    );

    // น้องนอต
    workbench(
      2620 -
      cameraX,

      FLOOR
    );

    crate(
      2790 -
      cameraX,

      FLOOR,
      1
    );

    crate(
      2842 -
      cameraX,

      FLOOR,
      0.9
    );

    // ประกอบ
    workbench(
      3060 -
      cameraX,

      FLOOR
    );

    signpost(
      3190 -
      cameraX,

      FLOOR,

      'ประกอบ'
    );

    // ตกแต่ง
    workbench(
      3510 -
      cameraX,

      FLOOR
    );

    crate(
      3675 -
      cameraX,

      FLOOR,
      1
    );

    signpost(
      3420 -
      cameraX,

      FLOOR,

      'ตกแต่ง'
    );

    // ประตูสุดท้าย
    rect(
      3920 -
      cameraX,

      FLOOR -
      118,

      18,
      118,

      '#6d462e'
    );

    rect(
      4075 -
      cameraX,

      FLOOR -
      118,

      18,
      118,

      '#6d462e'
    );

    rect(
      3900 -
      cameraX,

      FLOOR -
      125,

      212,
      28,

      '#905b37'
    );

    rect(
      3908 -
      cameraX,

      FLOOR -
      119,

      196,
      16,

      '#c88e4c'
    );

    pixelText(
      'WORKSHOP',

      4006 -
      cameraX,

      FLOOR -
      111,

      14,

      '#fff0bd',

      'center'
    );
  }

  // =========================
  // เครื่องหมาย !
  // =========================

  function drawQuestMarkers() {

    const zone =
      zones[
        Math.min(
          quest,
          8
        )
      ];

    const sx =
      zone.x -
      cameraX;

    if (
      sx >
      -80

      &&

      sx <
      W + 80
    ) {

      const bob =
        Math.sin(
          frameClock *
          5
        ) *
        4;

      rect(
        sx - 17,
        316 + bob,
        34,
        34,
        '#f1c347'
      );

      rect(
        sx - 13,
        320 + bob,
        26,
        26,
        '#fff1a6'
      );

      pixelText(
        '!',
        sx,
        334 + bob,
        24,
        '#5e4028',
        'center'
      );
    }
  }

  // ==================================================
  // วาดโลกทั้งหมด
  // ==================================================

  function drawWorld() {

    ctx.clearRect(
      0,
      0,
      W,
      H
    );

    // =====================================
    // พื้นหลังเดิม ไม่ใช้ PNG
    // =====================================

    // ท้องฟ้าหลัก
    rect(
      0,
      0,
      W,
      H,
      '#63c6df'
    );

    // ท้องฟ้าชั้นบน
    rect(
      0,
      0,
      W,
      82,
      '#6ad0e6'
    );

    // =====================================
    // ดวงอาทิตย์
    // =====================================

    rect(
      742,
      44,
      58,
      58,
      '#f3db78'
    );

    rect(
      750,
      36,
      42,
      74,
      '#f6e695'
    );

    rect(
      734,
      52,
      74,
      42,
      '#f6e695'
    );

    // =====================================
    // เมฆ
    // =====================================

    for (
      let i = 0;
      i < 7;
      i++
    ) {

      cloud(

        (
          (
            i *
            255

            -

            cameraX *
            0.08
          )

          %

          1250
        )

        -

        120,

        58 +
        (
          i %
          3
        ) *
        48,

        0.75 +
        (
          i %
          2
        ) *
        0.2
      );
    }

    // =====================================
    // ภูเขาชั้นไกล
    // =====================================

    drawMountainLayer(
      cameraX *
      0.08,

      '#8bd0c5',

      270,

      92,

      270
    );

    // =====================================
    // ภูเขาชั้นกลาง
    // =====================================

    drawMountainLayer(
      cameraX *
      0.15,

      '#55a68b',

      338,

      115,

      230
    );

    // =====================================
    // ภูเขาชั้นหน้า
    // =====================================

    drawMountainLayer(
      cameraX *
      0.23,

      '#2e7d5c',

      392,

      86,

      170
    );

    // =====================================
    // ป่าสนด้านหลัง
    // =====================================

    for (
      let i = 0;
      i < 20;
      i++
    ) {

      const x =

        (
          (
            i *
            210

            -

            cameraX *
            0.32
          )

          %

          4400
        )

        -

        130;

      pine(

        x,

        425,

        0.9 +
        (
          i %
          3
        ) *
        0.12,

        [
          '#176044',
          '#257a4c',
          '#3b9559'
        ]
      );
    }

    // =====================================
    // ต้นไม้ชั้นหน้า
    // =====================================

    for (
      let i = 0;
      i < 11;
      i++
    ) {

      const x =

        (
          (
            i *
            410

            -

            cameraX *
            0.55
          )

          %

          4700
        )

        -

        220;

      broadTree(

        x,

        455,

        0.85 +
        (
          i %
          2
        ) *
        0.1
      );
    }

    // =====================================
    // พื้นและแท่น
    // =====================================

    platforms
      .forEach(
        drawPlatform
      );

    // =====================================
    // หญ้า
    // =====================================

    for (
      let i = 0;
      i < 26;
      i++
    ) {

      const wx =
        140 +
        i *
        155;

      const sx =
        wx -
        cameraX;

      if (
        sx >
        -20

        &&

        sx <
        W + 20
      ) {

        grassTuft(

          sx,

          FLOOR,

          0.9 +
          (
            i %
            2
          ) *
          0.2
        );
      }
    }

    // =====================================
    // ดอกไม้
    // =====================================

    const flowerColors =
      [
        '#f8d85f',
        '#ef8dac',
        '#f5f2dc',
        '#6ca3e8'
      ];

    for (
      let i = 0;
      i < 34;
      i++
    ) {

      const wx =
        80 +
        i *
        121;

      const sx =
        wx -
        cameraX;

      if (
        sx >
        -10

        &&

        sx <
        W + 10
      ) {

        flower(

          sx,

          FLOOR -
          4,

          flowerColors[
            i %
            flowerColors.length
          ]
        );
      }
    }

    // ของตามด่าน
    zoneDecorations();

    // ครูไม้
    drawTeacher(
      210,
      FLOOR -
      34
    );

    // น้องนอต
    drawRobot(
      2540,
      FLOOR -
      28
    );

    // ป้ายภารกิจ
    drawQuestMarkers();

    // ผู้เล่น
    drawPlayer();

    // =====================================
    // ชื่อแต่ละโซน
    // =====================================

    const zoneTitles =
      [
        [
          520,
          'MEASUREMENT GARDEN'
        ],

        [
          1480,
          'FIXING WORKSHOP'
        ],

        [
          2440,
          'ASSEMBLY GROVE'
        ],

        [
          3360,
          'WOODCRAFT CORNER'
        ]
      ];

    zoneTitles.forEach(
      (
        [
          x,
          title
        ]
      ) => {

        const sx =
          x -
          cameraX;

        if (
          sx >
          -300

          &&

          sx <
          W + 300
        ) {

          pixelText(

            title,

            sx,

            32,

            13,

            '#fff1c2',

            'center'
          );
        }
      }
    );
  }

  // =========================
  // Collision
  // =========================

  function collidePlatforms(
    oldY
  ) {

    player.onGround =
      false;

    for (
      const p
      of platforms
    ) {

      const withinX =

        player.x +
        player.w -
        6 >
        p.x

        &&

        player.x +
        6 <
        p.x +
        p.w;

      if (
        !withinX
      ) {
        continue;
      }

      const oldBottom =
        oldY +
        player.h;

      const newBottom =
        player.y +
        player.h;

      if (

        player.vy >=
        0

        &&

        oldBottom <=
        p.y +
        6

        &&

        newBottom >=
        p.y

      ) {

        player.y =
          p.y -
          player.h;

        player.vy =
          0;

        player.onGround =
          true;

        return;
      }
    }
  }

  // =========================
  // Update
  // =========================

  function update(
    dt
  ) {

    frameClock +=
      dt;

    if (
      !started
    ) {
      return;
    }

    if (
      !dialog.classList
        .contains(
          'hidden'
        )
    ) {
      return;
    }

    if (
      !modal.classList
        .contains(
          'hidden'
        )
    ) {
      return;
    }

    player.vx =

      (
        keys.right

          ? RUN_SPEED

          : 0
      )

      -

      (
        keys.left

          ? RUN_SPEED

          : 0
      );

    if (
      player.vx >
      0
    ) {
      player.face =
        1;
    }

    if (
      player.vx <
      0
    ) {
      player.face =
        -1;
    }

    // กระโดด
    if (
      jumpQueued

      &&

      player.onGround
    ) {

      player.vy =
        -JUMP_SPEED;

      player.onGround =
        false;

      tone(
        430,
        0.05
      );
    }

    jumpQueued =
      false;

    const oldY =
      player.y;

    player.vy +=
      GRAVITY *
      dt;

    player.x +=
      player.vx *
      dt;

    player.y +=
      player.vy *
      dt;

    player.x =
      Math.max(

        20,

        Math.min(

          WORLD_W -
          50,

          player.x
        )
      );

    collidePlatforms(
      oldY
    );

    // ตกจากฉาก
    if (
      player.y >
      H +
      120
    ) {

      player.x =
        player.checkpointX;

      player.y =
        player.checkpointY;

      player.vx =
        0;

      player.vy =
        0;

      showToast(
        'กลับมาที่จุดปลอดภัยแล้ว'
      );
    }

    // กล้อง
    cameraX =
      Math.max(

        0,

        Math.min(

          WORLD_W -
          W,

          player.x -
          320
        )
      );
  }

  // =========================
  // Game loop
  // =========================

  function loop(
    time
  ) {

    const dt =
      Math.min(

        0.033,

        (
          time -
          lastTime
        )

        /

        1000
      );

    lastTime =
      time;

    update(
      dt
    );

    drawWorld();

    requestAnimationFrame(
      loop
    );
  }

  // =========================
  // เลือกตัวละครหญิง
  // =========================

  document
    .getElementById(
      'femaleBtn'
    )
    .addEventListener(
      'click',
      () => {

        selectedGender =
          'female';

        document
          .getElementById(
            'femaleBtn'
          )
          .classList
          .add(
            'selected'
          );

        document
          .getElementById(
            'maleBtn'
          )
          .classList
          .remove(
            'selected'
          );

        document
          .getElementById(
            'femaleBtn'
          )
          .setAttribute(
            'aria-pressed',
            'true'
          );

        document
          .getElementById(
            'maleBtn'
          )
          .setAttribute(
            'aria-pressed',
            'false'
          );
      }
    );

  // =========================
  // เลือกตัวละครชาย
  // =========================

  document
    .getElementById(
      'maleBtn'
    )
    .addEventListener(
      'click',
      () => {

        selectedGender =
          'male';

        document
          .getElementById(
            'maleBtn'
          )
          .classList
          .add(
            'selected'
          );

        document
          .getElementById(
            'femaleBtn'
          )
          .classList
          .remove(
            'selected'
          );

        document
          .getElementById(
            'maleBtn'
          )
          .setAttribute(
            'aria-pressed',
            'true'
          );

        document
          .getElementById(
            'femaleBtn'
          )
          .setAttribute(
            'aria-pressed',
            'false'
          );
      }
    );

  // =========================
  // ปุ่มต่าง ๆ
  // =========================

  document
    .getElementById(
      'startBtn'
    )
    .addEventListener(
      'click',
      startGame
    );

  document
    .getElementById(
      'bookBtn'
    )
    .addEventListener(
      'click',
      openBook
    );

  document
    .getElementById(
      'restartBtn'
    )
    .addEventListener(
      'click',
      resetGame
    );

  document
    .getElementById(
      'soundBtn'
    )
    .addEventListener(
      'click',
      event => {

        soundOn =
          !soundOn;

        event.currentTarget.textContent =
          soundOn

            ? '🔊 เสียง'

            : '🔇 ปิดเสียง';

        if (
          soundOn
        ) {

          tone(
            650,
            0.06
          );
        }
      }
    );

  document
    .getElementById(
      'interactBtn'
    )
    .addEventListener(
      'click',
      interact
    );

  document
    .getElementById(
      'jumpBtn'
    )
    .addEventListener(
      'click',
      () => {

        jumpQueued =
          true;
      }
    );

  // =========================
  // Keyboard
  // =========================

  root.addEventListener(
    'keydown',
    event => {

      if (
        [
          'INPUT',
          'SELECT',
          'TEXTAREA',
          'BUTTON'
        ]
          .includes(
            document
              .activeElement
              .tagName
          )
      ) {
        return;
      }

      const k =
        event.key
          .toLowerCase();

      if (
        [
          'arrowleft',
          'arrowright',
          'arrowup',
          'a',
          'd',
          'w',
          ' ',
          'e'
        ]
          .includes(
            k
          )
      ) {
        event.preventDefault();
      }

      if (
        k ===
        'a'

        ||

        k ===
        'arrowleft'
      ) {

        keys.left =
          true;
      }

      if (
        k ===
        'd'

        ||

        k ===
        'arrowright'
      ) {

        keys.right =
          true;
      }

      if (
        k ===
        'w'

        ||

        k ===
        'arrowup'

        ||

        k ===
        ' '
      ) {

        jumpQueued =
          true;
      }

      if (
        k ===
        'e'
      ) {

        interact();
      }
    }
  );

  root.addEventListener(
    'keyup',
    event => {

      const k =
        event.key
          .toLowerCase();

      if (
        k ===
        'a'

        ||

        k ===
        'arrowleft'
      ) {

        keys.left =
          false;
      }

      if (
        k ===
        'd'

        ||

        k ===
        'arrowright'
      ) {

        keys.right =
          false;
      }
    }
  );

  // =========================
  // ปุ่มมือถือ
  // =========================

  document
    .querySelectorAll(
      '[data-move]'
    )
    .forEach(
      button => {

        const dir =
          button.dataset
            .move;

        button.addEventListener(
          'pointerdown',
          event => {

            event.preventDefault();

            keys[
              dir
            ] = true;
          }
        );

        [
          'pointerup',
          'pointercancel',
          'pointerleave'
        ]
          .forEach(
            type => {

              button.addEventListener(
                type,
                () => {

                  keys[
                    dir
                  ] = false;
                }
              );
            }
          );
      }
    );

  // =========================
  // เริ่มต้นระบบ
  // =========================

  drawCharacterPreview(
    document
      .getElementById(
        'femalePreview'
      ),

    'female'
  );

  drawCharacterPreview(
    document
      .getElementById(
        'malePreview'
      ),

    'male'
  );

  updateHUD();

  requestAnimationFrame(
    loop
  );

})();
