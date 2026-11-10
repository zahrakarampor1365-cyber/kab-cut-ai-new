
export default async (req) => {
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "روش درخواست مجاز نیست" }),
      { status: 405 }
    );
  }

  try {
    const body = await req.json();
    const { apiKey, model, baseUrl, messages } = body;

    if (!apiKey || !model || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "اطلاعات درخواست ناقص است" }),
        { status: 400 }
      );
    }

    const url = new URL(
      baseUrl || "https://api.groq.com/openai/v1"
    );

    if (
      url.protocol !== "https:" ||
      url.hostname !== "api.groq.com" ||
      url.pathname.replace(/\/+$/, "") !== "/openai/v1"
    ) {
      return new Response(
        JSON.stringify({ error: "آدرس API معتبر نیست" }),
        { status: 400 }
      );
    }

    const result = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.7
        })
      }
    );

    const data = await result.json();

    if (!result.ok) {
      return new Response(
        JSON.stringify({
          error: data.error?.message || "خطا از طرف Groq"
        }),
        { status: result.status }
      );
    }

    return new Response(
      JSON.stringify({
        reply: data.choices?.[0]?.message?.content || ""
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: "خطا در ارتباط با سرور" }),
      { status: 500 }
    );
  }
};
