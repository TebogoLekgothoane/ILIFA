import { Router, type IRouter } from "express";

const router: IRouter = Router();

router.post("/pastport/guide", (req, res) => {
  const question = typeof req.body?.question === "string" ? req.body.question.trim() : "";
  const year = Number(req.body?.year);
  const object = typeof req.body?.object === "string" ? req.body.object : "";

  if (!question || !Number.isFinite(year)) {
    res.status(400).json({ message: "A question and historical year are required." });
    return;
  }

  const normalized = question.toLowerCase();
  let answer =
    "Rail connected East London to a much larger network, making this station a place where local life met national movement. Historical sources are limited on some details, so PASTPORT separates documented context from reconstruction.";

  if (normalized.includes("interesting")) {
    answer =
      "The station was more than a stop. It was a threshold between the coast and the interior, carrying people, letters, goods, and news into a changing Eastern Cape. The scene is an AI reconstruction based on available historical sources.";
  } else if (normalized.includes("look") || normalized.includes("1950")) {
    answer =
      "The 1950s view would have been busier and more industrial, with post-war rail travel shaping the rhythm of the station. Exact street-level details are limited, so that layer is presented as a reconstruction rather than a verified photograph.";
  } else if (object) {
    answer = `You are looking at the reconstructed ${object} layer for ${year}. Its historical significance is shown alongside the source note so you can distinguish documented history from the visual reconstruction.`;
  }

  res.json({
    answer,
    documentedHistory: true,
    reconstructionNote:
      "The historical scene and object layers are demo reconstructions based on available historical sources.",
  });
});

export default router;