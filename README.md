# Mèo Trân Châu 🐱🧋

Game tiệm trà sữa mèo pixel art chạy ngay trên trình duyệt (điện thoại và máy tính).
Bắt đầu với một chiếc xe đẩy, dành dụm để lên ki-ốt góc chợ rồi mở tiệm riêng.
Mỗi ngày: đi chợ → chuẩn bị (ủ trà, nấu trân châu qua mini game) → bán hàng → xem hóa đơn.

Toàn bộ hình ảnh là pixel art vẽ bằng code, âm thanh và nhạc nền được tổng hợp trực tiếp bằng Web Audio,
không dùng file hình hay âm thanh bên ngoài.

## Chạy thử

```bash
npm install
npm run dev        # mở http://localhost:5173
```

## Build và kiểm tra

```bash
npm run build      # dist/index.html — một file HTML duy nhất, đã gộp CSS và JS
npm run preview    # xem thử bản build
npm run typecheck  # kiểm tra kiểu TypeScript
npm test           # chạy test (Vitest)
npm run check      # typecheck + test + build, giống CI trên GitHub
npm run artifact   # build/artifact.html — bản dùng để đăng lên Claude artifact
```

Mỗi lần đẩy code lên `main`, GitHub Actions (`.github/workflows/ci.yml`) tự chạy typecheck, test và build.

## Deploy

- **Netlify (khuyên dùng):** kết nối repo GitHub, Netlify tự đọc `netlify.toml` (build `npm run build`, publish `dist`).
  Để tiết kiệm credit của gói miễn phí, Netlify **chỉ build commit có chữ `[deploy]` trong lời nhắn**; các commit khác được bỏ qua.
  Hoặc chạy `npm run build` rồi kéo thả thư mục `dist/` vào tab *Deploys* của site.
- **itch.io:** nén `dist/index.html` thành .zip, tạo project loại *HTML*, bật *Mobile friendly*.
- **GitHub Pages:** đưa `dist/index.html` lên nhánh `gh-pages` hoặc dùng GitHub Actions.

## Cấu trúc

```
index.html              khung trang: các màn hình (chợ, chuẩn bị, bán hàng, hóa đơn, tạm dừng)
src/main.ts             điểm vào: nạp các module rồi mở ngày đầu tiên
src/types.ts            kiểu dữ liệu dùng chung: Order, Cup, Customer, Save…
src/data.ts             dữ liệu game: menu, giá, loại khách, cấp độ, đồ trong chợ, nhân viên, sự kiện, khách quen
src/logic/              luật chơi thuần tuý, không đụng tới giao diện, có test đi kèm (*.test.ts)
  cup.ts                  so ly với order: phần nào khớp, sai mấy chỗ, hoàn hảo / gần đúng / hỏng
  economy.ts              giá ly, tiền tip, mục tiêu ngày, cấp độ, tâm trạng khách
  stock.ts                kho trà và trân châu theo mẻ, mẻ cũ dùng trước
src/game/               phần chạy game trên trình duyệt
  core.ts                 hàm tiện ích, canvas, dữ liệu lưu (save), kho, giá
  state.ts                trạng thái của ngày đang chơi (S) và ly trên quầy (cup)
  settings.ts, audio.ts   cài đặt; hiệu ứng âm thanh và nhạc nền tổng hợp bằng Web Audio
  customers.ts            sinh khách và order, sự kiện ngày, mùa, khách quen
  serve.ts                phục vụ, đóng túi đơn nhiều ly, dòng nhắc
  station.ts, icons.ts    quầy pha chế (nút trà/đường/đá/topping, dán nắp, pha y chang) và icon pixel
  orders.ts               bong bóng order, hàng khách chờ, nút Phục vụ, thanh trạng thái
  draw.ts, cats.ts, fx.ts vẽ cảnh phố và khách; ba bé mèo của tiệm; hiệu ứng, biển OPEN
  prep.ts                 mini game chuẩn bị (ủ trà, đun nước, đánh bọt, nhào bột, nấu trân châu)
  quests.ts, day.ts       nhiệm vụ ngày; chợ, doanh thu, sổ khách quen, hóa đơn cuối ngày
  loop.ts, input.ts       vòng lặp game; bàn phím, chạm, menu tạm dừng, sao lưu
src/styles/main.css     giao diện, bố cục responsive cho mọi kích thước màn hình
scripts/                make-artifact.mjs (bản artifact); fix-imports.cjs (tự sắp lại import trong src/game)
```

Chỉnh cân bằng game (giá, lương, XP, mục tiêu) trong `src/data.ts` và `src/logic/economy.ts`.

Dữ liệu người chơi lưu trong `localStorage` (khóa `tcs-save3`), cài đặt trong `tcs-settings`.
Người chơi có thể sao lưu/khôi phục bằng mã trong menu Tạm dừng.

## Số liệu chơi ẩn danh

`src/game/analytics.ts` gửi số liệu lên [Umami Cloud](https://umami.is): không cookie, không lưu IP, không tên hay mã người chơi.
Chỉ chạy trên site `*.netlify.app` (chạy trên máy hay bản artifact thì không gửi), và người chơi tắt được trong Cài đặt.

| Sự kiện | Dữ liệu kèm theo |
|---|---|
| `new_game`, `continue`, `restart` | ngày đang chơi, màn hình dọc/ngang |
| `day_end` | ngày, số ly, ly hoàn hảo, khách bỏ về, số sao, đạt mục tiêu chưa, số nhân viên |
| `play_time` | số giây chơi (chỉ tính lúc game đang hiện trên màn hình), gửi khi rời tab/app |
| `hire`, `unlock`, `upgrade` | nhân viên / món / nâng cấp nào, vào ngày mấy |

Lượt truy cập, loại thiết bị, trình duyệt, quốc gia do Umami tự đếm.

## Lộ trình

- [x] Mở tính năng dần theo ngày cho người mới
- [x] Sao lưu / khôi phục bằng mã
- [x] Tách code thành module, chuyển sang TypeScript, test luật chơi bằng Vitest, CI trên GitHub Actions
- [ ] Siết kiểu chặt dần cho `src/game/` (hiện `src/logic/` và dữ liệu đã strict)
- [x] Sổ khách quen: 8 khách có tên, món ruột, tình thân 5 ♥, câu chuyện và quà
- [x] Sự kiện mỗi ngày (mưa, ngày lễ, nắng nóng, reviewer) và theo mùa (Trung Thu, Tết)
- [x] Mặt bằng: xe đẩy → ki-ốt góc chợ → tiệm (nhân viên, trang trí, đơn online chỉ có ở tiệm)
- [x] Trang trí tiệm: 8 món, điểm ấm cúng tăng tip và độ kiên nhẫn
- [x] Thấy rõ lợi ích nâng cấp: màn hình khai trương, hóa đơn ghi “Nhờ nâng cấp hôm nay”, nâng cấp riêng cho xe đẩy và ki-ốt
- [x] Quà mỗi ngày theo chuỗi ngày thật (7 ngày, ngày 7 tặng bé mèo Hoàng Tử)
- [x] Sổ mèo: 7 bé mèo ghé thăm giữa ca, chạm để làm quen, mỗi bé +1 ấm cúng
- [x] Hướng dẫn chơi lần đầu (bé Bơ dẫn qua 11 bước)
- [x] Thành tích: 14 mốc, 3 món trang trí độc quyền
- [x] Mùa theo lịch thật: món giới hạn và trang trí riêng cho Hè, Trung Thu, Halloween, Giáng Sinh, Tết
  (xem trước bằng cách thêm `?season=halloween` vào địa chỉ trang)
- [ ] Quán cà phê mèo 2 tầng / chi nhánh thứ hai
- [ ] Kiểm thử tự động (Playwright) cho vòng chơi một ngày trong CI
