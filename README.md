# เกาะช่างจิ๋ว : ภารกิจเปิดเวิร์กช็อป

เกม 2D Pixel Platformer ภาษาไทย เรื่องเครื่องมือช่าง เล่นบนเว็บได้ทันที

## ไฟล์ในโปรเจกต์

- `index.html` — หน้าเกม
- `style.css` — รูปแบบ UI และหน้าเลือกตัวละคร
- `game.js` — ระบบเดิน กระโดด ภารกิจ คำถาม คะแนน และสมุดเครื่องมือ
- `assets/cover.png` — ภาพหน้าปก/ภาพอ้างอิงบรรยากาศเกม

## ทดลองเล่นในคอมพิวเตอร์

วิธีง่ายที่สุดคือเปิดโฟลเดอร์ด้วย Visual Studio Code และใช้ส่วนขยาย Live Server

1. เปิดโฟลเดอร์ `tiny-workshop-island`
2. คลิกขวา `index.html`
3. เลือก `Open with Live Server`

หรือใช้ Python:

```bash
python -m http.server 8000
```

แล้วเปิด `http://localhost:8000`

## วิธีลง GitHub Pages

### 1. สร้างบัญชี GitHub
ไปที่ https://github.com และสมัคร/เข้าสู่ระบบ

### 2. สร้าง Repository
1. กดปุ่ม `New`
2. ตั้งชื่อ เช่น `tiny-workshop-island`
3. เลือก `Public`
4. กด `Create repository`

### 3. อัปโหลดไฟล์เกม
1. ในหน้า repository กด `Add file`
2. เลือก `Upload files`
3. ลากไฟล์และโฟลเดอร์ทั้งหมดจากโฟลเดอร์เกมลงไป ได้แก่
   - `index.html`
   - `style.css`
   - `game.js`
   - โฟลเดอร์ `assets`
   - `README.md`
4. ตรวจว่าชื่อโฟลเดอร์ `assets` และไฟล์ `cover.png` อยู่ครบ
5. พิมพ์ข้อความ commit เช่น `Upload game`
6. กด `Commit changes`

### 4. เปิด GitHub Pages
1. เข้า `Settings` ของ repository
2. เลือกเมนู `Pages`
3. ที่ `Build and deployment` เลือก `Deploy from a branch`
4. Branch เลือก `main`
5. Folder เลือก `/(root)`
6. กด `Save`

### 5. เปิดเว็บไซต์
รอประมาณ 1–3 นาที จากนั้น GitHub จะแสดงลิงก์ประมาณนี้:

`https://USERNAME.github.io/tiny-workshop-island/`

ถ้าแก้ไฟล์ใน GitHub แล้ว Commit ใหม่ เว็บไซต์จะอัปเดตให้อัตโนมัติหลังรอสักครู่

## หมายเหตุ

- ห้ามเปลี่ยนชื่อ `index.html` เพราะ GitHub Pages ใช้ไฟล์นี้เป็นหน้าแรก
- ถ้าเปลี่ยนชื่อไฟล์ใน `assets` ต้องแก้ path ในโค้ดให้ตรงกัน
- เกมนี้ไม่ต้องใช้ฐานข้อมูลหรือเซิร์ฟเวอร์ จึงเหมาะกับ GitHub Pages
