import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

const PORT = 3000;

// =====================================
// DANH SÁCH SẢN PHẨM
// =====================================

const products = [
  { name: "Matcha đá xay", price: "45.000đ", bestSeller: true },
  { name: "Cà phê đen", price: "Chưa cập nhật giá", bestSeller: true },
  { name: "Bạc xỉu", price: "32.000đ", bestSeller: true },
  { name: "Cà phê sữa đá", price: "29.000đ", bestSeller: true },
  { name: "Cappuccino nóng", price: "Chưa cập nhật giá", bestSeller: false },
  { name: "Trà tắc mật ong", price: "Chưa cập nhật giá", bestSeller: false },
  { name: "Trà sữa", price: "Chưa cập nhật giá", bestSeller: false },
  { name: "Espresso", price: "Chưa cập nhật giá", bestSeller: false },
  { name: "Trà đào", price: "Chưa cập nhật giá", bestSeller: false },
  { name: "Socola đá xay", price: "Chưa cập nhật giá", bestSeller: false },
];

// =====================================
// DANH SÁCH BEST SELLER
// =====================================

const bestSellerReply = `Khánh Cafe hiện có chính xác 4 món Best Seller:

${products
  .filter((product) => product.bestSeller)
  .map((product, index) => `${index + 1}. ${product.name} - ${product.price}`)
  .join("\n")}

Đây là 4 sản phẩm được đánh dấu Best Seller trên thực đơn của Khánh Cafe. Bạn có thể tham khảo và lựa chọn món phù hợp nhé!`;

// =====================================
// DANH SÁCH MENU
// =====================================

const menuReply = products
  .map((product, index) => {
    return `${index + 1}. ${product.name} - ${product.price}`;
  })
  .join("\n");

// =====================================
// SYSTEM PROMPT
// =====================================

const systemPrompt = `
Bạn là chatbot tư vấn chính thức của website Khánh Cafe.

QUY ĐỊNH NGÔN NGỮ:
- BẮT BUỘC trả lời 100% bằng tiếng Việt có dấu.
- Tuyệt đối không sử dụng tiếng Trung hoặc chữ Hán.
- Không sử dụng tiếng Nhật, tiếng Hàn hoặc ngôn ngữ khác.
- Không dịch câu trả lời sang ngôn ngữ khác.
- Không viết thêm bản dịch ở cuối câu trả lời.
- Kể cả khi khách hỏi bằng tiếng Anh, vẫn trả lời bằng tiếng Việt.

THÔNG TIN WEBSITE KHÁNH CAFE:

Website có các trang:
1. Trang chủ: Giới thiệu tổng quan về quán.
2. Trang thực đơn: Hiển thị các loại đồ uống và Best Seller.
3. Trang không gian: Giới thiệu không gian quán.
4. Trang giới thiệu: Thông tin về Khánh Cafe.
5. Trang đăng nhập - đăng ký: Hỗ trợ tài khoản khách hàng.
6. Trang hỗ trợ: Trò chuyện với chatbot AI.

THỰC ĐƠN:

${products
  .map(
    (product) =>
      `- ${product.name} - ${product.price}${product.bestSeller ? " - BEST SELLER" : ""}`,
  )
  .join("\n")}

QUY TẮC:
- Chỉ tư vấn thông tin thuộc website Khánh Cafe.
- Không tự bịa thông tin.
- Không tự tạo giá bán.
- Không tự tạo sản phẩm.
- Không tự tạo địa chỉ hoặc số điện thoại.
- Không tự tạo chương trình khuyến mãi.
- Không tự tạo chính sách giao hàng hoặc thanh toán.
- Không tự thay đổi tên sản phẩm.
- Không tự nhận sản phẩm khác là Best Seller.
- Chỉ cung cấp giá đã được xác nhận.
- Nếu giá chưa cập nhật, hãy nói rõ chưa có giá.
- Nếu không biết thông tin, hãy nói:
"Xin lỗi, hiện tại mình chưa có thông tin này.
Bạn vui lòng liên hệ Khánh Cafe để được hỗ trợ nhé!"

PHONG CÁCH:
- Xưng hô mình và bạn.
- Thân thiện, lịch sự, chuyên nghiệp.
- Trả lời ngắn gọn, dễ hiểu.
- Không lặp lại câu hỏi.
- Không chuyển sang chủ đề khác.
- Luôn trả lời bằng tiếng Việt.
`;

// =====================================
// CHUẨN HÓA CÂU HỎI
// =====================================

function normalizeText(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .trim();
}

// =====================================
// NHẬN DIỆN BEST SELLER
// =====================================

function isBestSellerQuestion(question) {
  const q = normalizeText(question);

  const keywords = [
    "best seller",
    "bestseller",
    "ban chay",
    "noi bat",
    "mon ban chay",
    "mon noi bat",
    "mon nao nen thu",
    "san pham ban chay",
    "san pham noi bat",
  ];

  return keywords.some((keyword) => q.includes(keyword));
}

// =====================================
// NHẬN DIỆN MENU
// =====================================

function isMenuQuestion(question) {
  const q = normalizeText(question);

  const keywords = [
    "thuc don",
    "menu",
    "co nhung mon nao",
    "cac mon",
    "danh sach mon",
    "gia cac mon",
    "bang gia",
    "gia tien",
    "bao nhieu mon",
  ];

  return keywords.some((keyword) => q.includes(keyword));
}

// =====================================
// XỬ LÝ CHAT
// =====================================

app.post("/chat", async (req, res) => {
  try {
    const messages = Array.isArray(req.body.messages) ? req.body.messages : [];

    const validMessages = messages
      .filter(
        (m) =>
          ["user", "assistant"].includes(m.role) &&
          typeof m.content === "string",
      )
      .slice(-10);

    const lastMessage = validMessages[validMessages.length - 1];

    if (!lastMessage || lastMessage.role !== "user") {
      return res.status(400).json({
        reply: "Vui lòng nhập câu hỏi nhé!",
      });
    }

    const question = lastMessage.content;

    console.log("CÂU HỎI:", question);

    // KIỂM TRA BEST SELLER
    if (isBestSellerQuestion(question)) {
      console.log("ĐÃ NHẬN DIỆN BEST SELLER");

      return res.json({
        reply: bestSellerReply,
      });
    }

    // KIỂM TRA MENU
    if (isMenuQuestion(question)) {
      console.log("ĐÃ NHẬN DIỆN MENU");

      return res.json({
        reply: `Thực đơn Khánh Cafe hiện có 10 món:\n\n${menuReply}\n\nTrong đó có 4 món Best Seller. Bạn muốn tìm hiểu món nào nhé?`,
      });
    }

    // GỌI OLLAMA
    const response = await fetch("http://127.0.0.1:11434/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "qwen2.5:3b",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          ...validMessages,
        ],
        stream: false,
        options: {
          temperature: 0.2,
        },
      }),
    });

    if (!response.ok) {
      throw new Error("Không kết nối được với Ollama");
    }

    const data = await response.json();

    let reply = data.message?.content?.trim() || "";

    // KIỂM TRA PHẢN HỒI
    if (!reply) {
      reply = "Xin lỗi, mình chưa thể trả lời câu hỏi này. Bạn thử lại nhé!";
    }

    // CHẶN CHỮ HÁN
    if (/[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF]/.test(reply)) {
      reply =
        "Xin lỗi, mình chưa thể trả lời câu hỏi này bằng tiếng Việt. Bạn vui lòng thử lại nhé!";
    }

    res.json({
      reply: reply,
    });
  } catch (error) {
    console.log("Lỗi chatbot:", error);

    res.status(500).json({
      reply:
        "Xin lỗi, hiện tại chatbot Khánh Cafe đang gặp sự cố. Bạn thử lại nhé!",
    });
  }
});

// =====================================
// KHỞI ĐỘNG SERVER
// =====================================

app.listen(PORT, () => {
  console.log(`Khánh Cafe AI đang chạy tại cổng ${PORT}`);
});
