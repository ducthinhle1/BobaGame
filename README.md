# Mèo Trân Châu 🐱🧋

Game tiệm trà sữa mèo pixel art chạy ngay trên trình duyệt (điện thoại và máy tính).
Mỗi ngày: đi chợ → chuẩn bị (ủ trà, nấu trân châu qua mini game) → bán hàng → xem hóa đơn.

Toàn bộ hình ảnh là pixel art vẽ bằng code, âm thanh và nhạc nền được tổng hợp trực tiếp bằng Web Audio,
không dùng file hình hay âm thanh bên ngoài.

## Chạy thử

```bash
npm install
npm run dev        # mở http://localhost:5173
```

## Build

```bash
npm run build      # dist/index.html — một file HTML duy nhất, đã gộp CSS và JS
npm run preview    # xem thử bản build
npm run artifact   # build/artifact.html — bản dùng để đăng lên Claude artifact
```

## Deploy

- **Netlify (khuyên dùng):** kết nối repo GitHub, Netlify tự đọc `netlify.toml` (build `npm run build`, publish `dist`).
  Hoặc chạy `npm run build` rồi kéo thả thư mục `dist/` vào tab *Deploys* của site.
- **itch.io:** nén `dist/index.html` thành .zip, tạo project loại *HTML*, bật *Mobile friendly*.
- **GitHub Pages:** đưa `dist/index.html` lên nhánh `gh-pages` hoặc dùng GitHub Actions.

## Cấu trúc

```
index.html            khung trang: các màn hình (chợ, chuẩn bị, bán hàng, hóa đơn, tạm dừng)
src/data.js           dữ liệu game: menu, giá, loại khách, cấp độ, đồ trong chợ, nhân viên, tính năng theo ngày
src/main.js           logic game: vòng lặp, khách, pha chế, mini game, âm thanh, vẽ pixel art, lưu dữ liệu
src/styles/main.css   giao diện, bố cục responsive cho mọi kích thước màn hình
scripts/make-artifact.mjs  tạo bản artifact từ dist/index.html
```

Chỉnh cân bằng game (giá, lương, XP, mục tiêu) trong `src/data.js` và các hằng số ở đầu `src/main.js`.

Dữ liệu người chơi lưu trong `localStorage` (khóa `tcs-save3`), cài đặt trong `tcs-settings`.
Người chơi có thể sao lưu/khôi phục bằng mã trong menu Tạm dừng.

## Lộ trình

- [x] Mở tính năng dần theo ngày cho người mới
- [x] Sao lưu / khôi phục bằng mã
- [ ] Tách `main.js` thành các module: `audio/`, `render/` (cảnh, cốc, icon), `systems/` (khách, kho, nhân viên, nhiệm vụ), `ui/`
- [ ] Chuyển sang TypeScript
- [x] Sổ khách quen: 8 khách có tên, món ruột, tình thân 5 ♥, câu chuyện và quà
- [x] Sự kiện mỗi ngày (mưa, ngày lễ, nắng nóng, reviewer) và theo mùa (Trung Thu, Tết)
- [ ] Trang trí tiệm, chi nhánh thứ hai
- [ ] Kiểm thử tự động (Playwright) cho vòng chơi một ngày
