import { useEffect, useRef, useState } from "react";
import * as tmImage from "@teachablemachine/image";
import "./App.css";
import { analyzeMaizeImage, API_BASE_URL } from "./services/analyzeApi";
import {
  getDiagnosisInfo,
  HEALTHY_LABELS,
  INVALID_LABELS,
  labelDisplayName,
  SUPPORTED_LABELS,
} from "./utils/maizeKnowledge";

const MODEL_BASE = `${import.meta.env.BASE_URL}model/`;
const HISTORY_STORAGE_KEY = "drzea-maize-history";
const LOGO_PATH = `${import.meta.env.BASE_URL}app-logo.png`;
const SLIDER_IMAGES = [
  `${import.meta.env.BASE_URL}image1.png`,
  `${import.meta.env.BASE_URL}image2.png`,
  `${import.meta.env.BASE_URL}image3.png`,
];
const ABOUT_GRID_IMAGES = [
  `${import.meta.env.BASE_URL}image6.jpeg`,
  `${import.meta.env.BASE_URL}image7.jpeg`,
  `${import.meta.env.BASE_URL}image8.jpeg`,
];
const ABOUT_COLUMN_IMAGES = [
  `${import.meta.env.BASE_URL}image9.jpeg`,
  `${import.meta.env.BASE_URL}image10.jpeg`,
  `${import.meta.env.BASE_URL}image11.jpeg`,
];
const GRID_COLUMNS = 4;
const GRID_ROWS = 4;

const sliderCards = [
  {
    title: "Scanning field intelligence",
    text: "Monitor maize crop health with AI-powered scanning, fast disease localization, and field-ready analysis support.",
    image: SLIDER_IMAGES[0],
  },
  {
    title: "Simple crop upload workflow",
    text: "Upload a maize crop image, review the detected issue, and move quickly from image capture to recommendation.",
    image: SLIDER_IMAGES[1],
  },
  {
    title: "Mobile-ready farmer dashboard",
    text: "See field insights, smart weather cues, and crop history in a cleaner experience inspired by practical farm usage.",
    image: SLIDER_IMAGES[2],
  },
];

const locationNames = [
  "top-left",
  "top-center-left",
  "top-center-right",
  "top-right",
  "upper-left",
  "upper-center-left",
  "upper-center-right",
  "upper-right",
  "mid-left",
  "center-left",
  "center-right",
  "mid-right",
  "bottom-left",
  "bottom-center-left",
  "bottom-center-right",
  "bottom-right",
];

const aboutBullets = [
  "AI-based maize disease identification from leaf images",
  "Simple upload and camera capture experience for farmers and students",
  "Visual disease localization using Grad-CAM style heatmap support",
  "Clear treatment and prevention guidance linked to agritech knowledge",
  "Friendly workflow designed for field use and crop monitoring",
];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function formatPercent(value) {
  return `${(value * 100).toFixed(1)}%`;
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function loadJsonStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveHistory(entries) {
  localStorage.setItem(
    HISTORY_STORAGE_KEY,
    JSON.stringify(entries.slice(0, 15)),
  );
}

async function dataUrlToFile(dataUrl, filename) {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  return new File([blob], filename, { type: blob.type || "image/png" });
}

function toDisplayPredictions(predictions) {
  const supportedPredictions = predictions
    .filter((item) => SUPPORTED_LABELS.has(item.className))
    .map((item) => ({ ...item }));
  const totalSupportedProbability = supportedPredictions.reduce(
    (total, item) => total + item.probability,
    0,
  );

  if (totalSupportedProbability > 0) {
    supportedPredictions.forEach((item) => {
      item.probability = item.probability / totalSupportedProbability;
    });
  }

  return supportedPredictions
    .sort((a, b) => b.probability - a.probability)
    .slice(0, 4)
    .map((item) => ({
      ...item,
      label: labelDisplayName(item.className),
    }));
}

function buildScoreStrategy(label) {
  const normalized = label.toLowerCase();

  if (
    normalized.includes("rust") ||
    normalized.includes("blight") ||
    normalized.includes("spot") ||
    normalized.includes("rot")
  ) {
    return (r, g, b, brightness, saturation) => {
      const yellowBrown = r * 0.65 + g * 0.35 - b * 0.45;
      const dryTissue = Math.abs(r - g) < 40 ? brightness * 0.2 : 0;
      return clamp((yellowBrown + saturation * 0.4 + dryTissue) / 255, 0, 1);
    };
  }

  if (
    normalized.includes("nitrogen") ||
    normalized.includes("potassium") ||
    normalized.includes("phosphorous") ||
    normalized.includes("magnesium")
  ) {
    return (r, g, b, brightness, saturation) => {
      const chlorosis = ((r + g) / 2 - b * 0.2) / 255;
      const paleLeaf = brightness > 140 ? 0.2 : 0;
      return clamp(chlorosis * 0.8 + paleLeaf - saturation * 0.15, 0, 1);
    };
  }

  if (
    normalized.includes("worm") ||
    normalized.includes("borer") ||
    normalized.includes("herbicide")
  ) {
    return (r, g, b, brightness, saturation) => {
      const darkDamage = (150 - brightness) / 150;
      const edgeBurn = (r - g * 0.5 - b * 0.4) / 255;
      return clamp(
        darkDamage * 0.55 + edgeBurn * 0.65 + saturation * 0.1,
        0,
        1,
      );
    };
  }

  return (r, g, b, brightness) => {
    const nonGreen = (r + b) * 0.5 - g * 0.35;
    return clamp((nonGreen + brightness * 0.1) / 255, 0, 1);
  };
}

function createHeatmapFromImage(imageElement, label) {
  const width = imageElement.naturalWidth || imageElement.width || 512;
  const height = imageElement.naturalHeight || imageElement.height || 512;
  const sourceCanvas = document.createElement("canvas");
  sourceCanvas.width = width;
  sourceCanvas.height = height;

  const sourceContext = sourceCanvas.getContext("2d", {
    willReadFrequently: true,
  });
  sourceContext.drawImage(imageElement, 0, 0, width, height);

  const imageData = sourceContext.getImageData(0, 0, width, height).data;
  const scorePixel = buildScoreStrategy(label);
  const heatCanvas = document.createElement("canvas");
  heatCanvas.width = width;
  heatCanvas.height = height;
  const heatContext = heatCanvas.getContext("2d");

  const cellWidth = Math.floor(width / GRID_COLUMNS);
  const cellHeight = Math.floor(height / GRID_ROWS);
  const cells = [];

  for (let row = 0; row < GRID_ROWS; row += 1) {
    for (let column = 0; column < GRID_COLUMNS; column += 1) {
      const startX = column * cellWidth;
      const endX = column === GRID_COLUMNS - 1 ? width : startX + cellWidth;
      const startY = row * cellHeight;
      const endY = row === GRID_ROWS - 1 ? height : startY + cellHeight;
      let total = 0;
      let count = 0;

      for (let y = startY; y < endY; y += 3) {
        for (let x = startX; x < endX; x += 3) {
          const pixelIndex = (y * width + x) * 4;
          const r = imageData[pixelIndex];
          const g = imageData[pixelIndex + 1];
          const b = imageData[pixelIndex + 2];
          const brightness = (r + g + b) / 3;
          const saturation = Math.max(r, g, b) - Math.min(r, g, b);
          total += scorePixel(r, g, b, brightness, saturation);
          count += 1;
        }
      }

      cells.push({
        column,
        row,
        score: count ? total / count : 0,
      });
    }
  }

  const peak = Math.max(...cells.map((cell) => cell.score), 0.15);
  heatContext.clearRect(0, 0, width, height);

  cells.forEach((cell, index) => {
    const normalized = clamp(cell.score / peak, 0, 1);
    if (normalized < 0.42) {
      return;
    }

    const centerX = cell.column * cellWidth + cellWidth / 2;
    const centerY = cell.row * cellHeight + cellHeight / 2;
    const radius = Math.max(cellWidth, cellHeight) * (0.55 + normalized * 0.55);
    const gradient = heatContext.createRadialGradient(
      centerX,
      centerY,
      0,
      centerX,
      centerY,
      radius,
    );

    gradient.addColorStop(0, `rgba(255, 96, 71, ${0.68 * normalized})`);
    gradient.addColorStop(0.4, `rgba(255, 176, 93, ${0.44 * normalized})`);
    gradient.addColorStop(1, "rgba(255, 228, 174, 0)");

    heatContext.fillStyle = gradient;
    heatContext.beginPath();
    heatContext.arc(centerX, centerY, radius, 0, Math.PI * 2);
    heatContext.fill();

    heatContext.strokeStyle = `rgba(255, 248, 231, ${clamp(normalized * 0.55, 0.18, 0.5)})`;
    heatContext.lineWidth = 2;
    heatContext.strokeRect(
      cell.column * cellWidth + 6,
      cell.row * cellHeight + 6,
      Math.max(cellWidth - 12, 8),
      Math.max(cellHeight - 12, 8),
    );

    cells[index] = {
      ...cell,
      normalized,
    };
  });

  const affectedZones = [...cells]
    .filter((cell) => (cell.normalized ?? 0) >= 0.5)
    .sort((a, b) => (b.normalized ?? 0) - (a.normalized ?? 0))
    .slice(0, 3)
    .map((cell) => locationNames[cell.row * GRID_COLUMNS + cell.column]);

  return {
    heatmapUrl: heatCanvas.toDataURL("image/png"),
    affectedZones: affectedZones.length ? affectedZones : ["mid-leaf region"],
  };
}

function getWeatherIcon(codeLabel) {
  if (codeLabel.toLowerCase().includes("rain")) {
    return "Rain";
  }
  if (codeLabel.toLowerCase().includes("cloud")) {
    return "Cloud";
  }
  if (codeLabel.toLowerCase().includes("fog")) {
    return "Mist";
  }
  return "Sunny";
}

function getWeatherStatCards(weather) {
  return [
    { icon: "drop", label: "Rainfall", value: weather.rainfall },
    { icon: "sun", label: "Sunlight", value: weather.sunlight },
    { icon: "wind", label: "Windspeed", value: weather.windspeed },
    { icon: "cloud", label: "Cloudy", value: weather.cloudiness },
  ];
}

function App() {
  const [activePage, setActivePage] = useState("home");
  const [mode, setMode] = useState("upload");
  const [status, setStatus] = useState("Backend + local model check pending.");
  const [previewUrl, setPreviewUrl] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [history, setHistory] = useState(() =>
    loadJsonStorage(HISTORY_STORAGE_KEY, []),
  );
  const [weather, setWeather] = useState({
    loading: true,
    city: "Detecting location",
    temperature: "--",
    windspeed: "--",
    rainfall: "--",
    sunlight: "--",
    cloudiness: "--",
    codeLabel: "Loading forecast",
  });
  const [logoError, setLogoError] = useState(false);
  const [sliderIndex, setSliderIndex] = useState(0);
  const [sliderVisible, setSliderVisible] = useState(true);
  const weatherStats = getWeatherStatCards(weather);

  const renderWeatherGlyph = (icon) => {
    switch (icon) {
      case "drop":
        return "◔";
      case "sun":
        return "✦";
      case "wind":
        return "↝";
      case "cloud":
        return "☁";
      default:
        return "•";
    }
  };

  const videoRef = useRef(null);
  const imageRef = useRef(null);
  const streamRef = useRef(null);
  const modelRef = useRef(null);
  const analyzePreviewRef = useRef(null);
  const sliderIntervalRef = useRef(null);
  const touchStartXRef = useRef(0);
  const touchEndXRef = useRef(0);

  useEffect(() => {
    let cancelled = false;

    const loadModel = async () => {
      try {
        const model = await tmImage.load(
          `${MODEL_BASE}model.json`,
          `${MODEL_BASE}metadata.json`,
        );

        if (cancelled) {
          return;
        }

        modelRef.current = model;
        setModelReady(true);
        setStatus(
          "Local fallback model loaded. Upload or capture a maize leaf image to analyze.",
        );
      } catch {
        if (!cancelled) {
          setStatus(
            "Local fallback model could not be loaded. Backend prediction is still available if configured.",
          );
        }
      }
    };

    loadModel();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(
    () => () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    },
    [],
  );

  useEffect(
    () => () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    },
    [previewUrl],
  );

  const showSlide = (nextIndex) => {
    setSliderVisible(false);
    window.setTimeout(() => {
      setSliderIndex(nextIndex);
      setSliderVisible(true);
    }, 180);
  };

  const goToNextSlide = () => {
    showSlide((sliderIndex + 1) % sliderCards.length);
  };

  const goToPreviousSlide = () => {
    showSlide((sliderIndex - 1 + sliderCards.length) % sliderCards.length);
  };

  const resetSliderTimer = () => {
    if (sliderIntervalRef.current) {
      window.clearInterval(sliderIntervalRef.current);
    }

    sliderIntervalRef.current = window.setInterval(() => {
      setSliderVisible(false);
      window.setTimeout(() => {
        setSliderIndex((current) => (current + 1) % sliderCards.length);
        setSliderVisible(true);
      }, 180);
    }, 6200);
  };

  useEffect(() => {
    resetSliderTimer();

    return () => {
      if (sliderIntervalRef.current) {
        window.clearInterval(sliderIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    const codeMap = {
      0: "Clear sky",
      1: "Mostly clear",
      2: "Partly cloudy",
      3: "Cloudy",
      45: "Foggy",
      51: "Light drizzle",
      61: "Light rain",
      63: "Rain",
      65: "Heavy rain",
      80: "Rain showers",
      95: "Thunderstorm",
    };

    const getPlaceName = async (latitude, longitude) => {
      try {
        const response = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
        );
        const data = await response.json();
        return (
          data.city ||
          data.locality ||
          data.principalSubdivision ||
          data.countryName ||
          "Current field location"
        );
      } catch {
        return "Current field location";
      }
    };

    const loadWeather = async (latitude, longitude, fallbackPlace) => {
      try {
        const [forecastResponse, placeName] = await Promise.all([
          fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code,wind_speed_10m,rain,cloud_cover&daily=sunshine_duration&timezone=auto`,
          ),
          getPlaceName(latitude, longitude),
        ]);

        const data = await forecastResponse.json();
        if (ignore) {
          return;
        }

        setWeather({
          loading: false,
          city: placeName || fallbackPlace,
          temperature: `${Math.round(data.current.temperature_2m)}°C`,
          windspeed: `${Math.round(data.current.wind_speed_10m)} km/h`,
          rainfall: `${Number(data.current.rain ?? 0).toFixed(1)} mm`,
          sunlight: `${Math.round(((data.daily?.sunshine_duration?.[0] ?? 0) / 3600) * 10) / 10} hrs`,
          cloudiness: `${Math.round(data.current.cloud_cover ?? 0)}%`,
          codeLabel: codeMap[data.current.weather_code] ?? "Weather update",
        });
      } catch {
        if (!ignore) {
          setWeather({
            loading: false,
            city: fallbackPlace,
            temperature: "--",
            windspeed: "--",
            rainfall: "--",
            sunlight: "--",
            cloudiness: "--",
            codeLabel: "Unable to load forecast",
          });
        }
      }
    };

    if (!navigator.geolocation) {
      loadWeather(13.0827, 80.2707, "Chennai");
      return () => {
        ignore = true;
      };
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        loadWeather(latitude, longitude, "Current field location");
      },
      () => {
        loadWeather(13.0827, 80.2707, "Chennai");
      },
      { timeout: 8000 },
    );

    return () => {
      ignore = true;
    };
  }, []);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraActive(false);
  };

  const pushHistoryEntry = (result, preview) => {
    const entry = {
      id: `${Date.now()}`,
      createdAt: new Date().toISOString(),
      title: result.primary.label,
      confidence: result.primary.probability,
      affectedZones: result.affectedZones,
      severity: result.diagnosisInfo.severity,
      recommendation: result.diagnosisInfo.recommendations[0],
      preview,
      modelSource: result.modelSource,
    };

    const next = [entry, ...history].slice(0, 15);
    setHistory(next);
    saveHistory(next);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setCameraActive(true);
      setStatus("Camera is active. Frame the maize leaf and capture.");
    } catch {
      setStatus(
        "Camera access was blocked. You can still use the upload option.",
      );
    }
  };

  const analyzePreview = async () => {
    if (!imageRef.current || isAnalyzing) {
      return;
    }

    setIsAnalyzing(true);
    setAnalysis(null);
    setStatus("Analyzing maize leaf image...");
    setActivePage("upload");

    try {
      if (selectedFile) {
        try {
          const backendResult = await analyzeMaizeImage(selectedFile);
          const normalizedResult = {
            ...backendResult,
            diagnosisInfo: {
              ...backendResult.diagnosisInfo,
              fieldNote:
                backendResult.diagnosisInfo.fieldNote ??
                backendResult.diagnosisInfo.field_note,
            },
            heatmapUrl: backendResult.gradcamImage
              ? `data:image/png;base64,${backendResult.gradcamImage}`
              : "",
            limeUrl: backendResult.limeImage
              ? `data:image/png;base64,${backendResult.limeImage}`
              : "",
            modelSource: `backend API (${API_BASE_URL})`,
          };
          setAnalysis(normalizedResult);
          pushHistoryEntry(normalizedResult, previewUrl);
          setStatus(
            "Backend analysis complete with MobileNetV2 prediction, Grad-CAM, and LIME.",
          );
          return;
        } catch (error) {
          console.error(error);
          setStatus(
            "Backend not ready, so the app switched to the local browser fallback model.",
          );
        }
      }

      if (!modelRef.current) {
        setStatus(
          "Backend is unavailable and the local fallback model is not ready yet.",
        );
        return;
      }

      const predictions = await modelRef.current.predict(imageRef.current);
      const rankedPredictions = toDisplayPredictions(predictions);
      const primary = rankedPredictions[0];
      const diagnosisInfo = getDiagnosisInfo(primary.className);
      const visualization = createHeatmapFromImage(
        imageRef.current,
        primary.className,
      );
      const isHealthy = HEALTHY_LABELS.has(primary.className);
      const isInvalid = INVALID_LABELS.has(primary.className);

      const fallbackResult = {
        primary,
        rankedPredictions,
        diagnosisInfo,
        heatmapUrl: visualization.heatmapUrl,
        limeUrl: "",
        affectedZones:
          isHealthy || isInvalid
            ? ["no strong damage hotspot detected"]
            : visualization.affectedZones,
        modelSource: "local browser fallback model",
      };

      setAnalysis(fallbackResult);
      pushHistoryEntry(fallbackResult, previewUrl);

      if (isInvalid) {
        setStatus(
          "The image does not look like a clear maize leaf sample. Try another photo with better lighting.",
        );
      } else {
        setStatus(
          "Fallback analysis complete. Review the diagnosis and recommendation below.",
        );
      }
    } catch {
      setStatus(
        "Prediction failed for this image. Try another photo or verify the model files.",
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  analyzePreviewRef.current = analyzePreview;

  const handleSelectedImage = (url, file) => {
    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }

    setPreviewUrl(url);
    setSelectedFile(file);
    setAnalysis(null);
    setImageLoaded(false);
    setStatus("Image added. Preparing analysis...");
    setActivePage("upload");
  };

  const onUploadChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    handleSelectedImage(URL.createObjectURL(file), file);
  };

  const captureFromCamera = async () => {
    if (!videoRef.current) {
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas
      .getContext("2d")
      .drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    stopCamera();
    const dataUrl = canvas.toDataURL("image/png");
    const file = await dataUrlToFile(dataUrl, "captured-maize-leaf.png");
    handleSelectedImage(dataUrl, file);
  };

  useEffect(() => {
    if (!previewUrl || !imageLoaded || analysis || isAnalyzing) {
      return;
    }

    if (!selectedFile && !modelReady) {
      return;
    }

    analyzePreviewRef.current?.();
  }, [previewUrl, imageLoaded, selectedFile, modelReady, analysis, isAnalyzing]);

  const renderLogo = () => {
    if (!logoError) {
      return (
        <img
          src={LOGO_PATH}
          alt="DR.ZEA MAIZE logo"
          className="brand-logo-image"
          onError={() => setLogoError(true)}
        />
      );
    }

    return <div className="brand-logo-fallback">DZ</div>;
  };

  const handleSliderTouchStart = (event) => {
    touchStartXRef.current = event.touches[0].clientX;
  };

  const handleSliderTouchMove = (event) => {
    touchEndXRef.current = event.touches[0].clientX;
  };

  const handleSliderTouchEnd = () => {
    const delta = touchStartXRef.current - touchEndXRef.current;
    if (Math.abs(delta) < 40) {
      return;
    }

    if (delta > 0) {
      goToNextSlide();
    } else {
      goToPreviousSlide();
    }
    resetSliderTimer();
  };

  const renderSlider = (titleTag = "h3", extraClass = "") => {
    const HeadingTag = titleTag;

    return (
      <div
        className={`slider-stage full-hero ${extraClass}`.trim()}
        onTouchStart={handleSliderTouchStart}
        onTouchMove={handleSliderTouchMove}
        onTouchEnd={handleSliderTouchEnd}
      >
        <div
          className={`slider-banner ${extraClass === "large" ? "app-slider-banner" : ""} ${sliderVisible ? "is-visible" : "is-hidden"}`.trim()}
          style={{ backgroundImage: `url(${sliderCards[sliderIndex].image})` }}
        >
          <button
            type="button"
            className="slider-arrow slider-arrow-left"
            onClick={() => {
              goToPreviousSlide();
              resetSliderTimer();
            }}
            aria-label="Previous slide"
          >
            &#8249;
          </button>

          <div className="slider-banner-content">
            <div className="slider-banner-chip-row">
              <div className="slider-art-badge">
                {sliderCards[sliderIndex].badge}
              </div>
              <span className="slider-reference-pill">DR.ZEA field scan</span>
            </div>
            <HeadingTag>{sliderCards[sliderIndex].title}</HeadingTag>
            <p>{sliderCards[sliderIndex].text}</p>
          </div>

          <button
            type="button"
            className="slider-arrow slider-arrow-right"
            onClick={() => {
              goToNextSlide();
              resetSliderTimer();
            }}
            aria-label="Next slide"
          >
            &#8250;
          </button>
        </div>

        <div className="slider-dots">
          {sliderCards.map((_, index) => (
            <button
              key={index}
              type="button"
              className={sliderIndex === index ? "active" : ""}
              onClick={() => {
                showSlide(index);
                resetSliderTimer();
              }}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    );
  };

  const renderAboutImageGrid = () => (
    <div className="about-image-grid" aria-label="Maize leaf disease examples">
      {ABOUT_GRID_IMAGES.map((image, index) => (
        <img
          key={image}
          src={image}
          alt={`Maize leaf disease example ${index + 1}`}
          className="about-image-tile"
        />
      ))}
    </div>
  );

  const renderAboutImageColumn = () => (
    <aside className="about-image-column" aria-label="Maize damage samples">
      {ABOUT_COLUMN_IMAGES.map((image, index) => (
        <img
          key={image}
          src={image}
          alt={`Maize damage sample ${index + 1}`}
          className="about-column-image"
        />
      ))}
    </aside>
  );

  const renderMainHeader = () => (
    <header className="site-header">
      <div className="header-brand">
        <div className="header-logo">{renderLogo()}</div>
        <div>
          <h1 className="header-title">DR.ZEA MAIZE</h1>
          <p className="header-subtitle">Smart Maize Assistant</p>
        </div>
      </div>

      <nav className="header-nav">
        {["home", "upload", "history"].map((page) => (
          <button
            key={page}
            type="button"
            className={activePage === page ? "active" : ""}
            onClick={() => setActivePage(page)}
          >
            {page === "home"
              ? "Home"
              : page === "upload"
                ? "Upload"
                : "History"}
          </button>
        ))}
      </nav>
    </header>
  );

  return (
    <main className="layout-shell">
      <>
          {renderMainHeader()}

          {activePage === "home" ? (
            <section className="app-home-layout">
              <div className="home-top-hero">
                {renderSlider("h2", "wide large")}
              </div>

              <div className="home-bottom-row">
                <article className="info-card about-card">
                  <span className="section-label">About The App</span>
                  <h3>Built for fast, field-friendly maize disease support</h3>
                  <p>
                    Smart maize monitoring with AI diagnosis, affected-area
                    visualization, and recommendation support for faster
                    crop-care decisions.
                  </p>
                  <ul className="check-list">
                    {aboutBullets.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                  {renderAboutImageGrid()}
                </article>

                {renderAboutImageColumn()}

                <article className="info-card weather-card compact">
                  <span className="section-label">Weather Data</span>
                  {weather.loading ? (
                    <div className="weather-skeleton">
                      <div className="skeleton-block medium" />
                      <div className="skeleton-block small" />
                    </div>
                  ) : (
                    <>
                      <div className="weather-visual">
                        {getWeatherIcon(weather.codeLabel)}
                      </div>
                      <h3>{weather.city}</h3>
                      <div className="weather-value">{weather.temperature}</div>
                      <p>{weather.codeLabel}</p>
                      <div className="weather-icon-grid">
                        {weatherStats.map((item) => (
                          <div key={item.label} className="weather-stat-card">
                            <div className={`weather-stat-icon ${item.icon}`}>
                              {renderWeatherGlyph(item.icon)}
                            </div>
                            <span>{item.label}</span>
                            <strong>{item.value}</strong>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </article>
              </div>
            </section>
          ) : null}

          {activePage === "upload" ? (
            <section className="upload-layout">
              <div className="upload-page-card">
                <div className="upload-topline">
                  <div>
                    <span className="section-label">Upload Page</span>
                    <h2 className="upload-title">Upload or take a picture</h2>
                    <p className="top-status">{status}</p>
                  </div>
                </div>

                <div className="upload-center-grid">
                  <div className="upload-box">
                    {mode === "upload" ? (
                      <label className="upload-dropbox">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={onUploadChange}
                        />
                        <strong>Upload image</strong>
                        <span>Select a maize leaf image for AI diagnosis.</span>
                      </label>
                    ) : (
                      <div className="camera-box">
                        <div className="camera-preview">
                          <video ref={videoRef} playsInline muted />
                          {!cameraActive ? (
                            <div className="camera-mask">
                              Start camera to capture
                            </div>
                          ) : null}
                        </div>
                      </div>
                    )}

                    <div className="action-row">
                      <button
                        type="button"
                        className={mode === "upload" ? "active" : ""}
                        onClick={() => {
                          setMode("upload");
                          stopCamera();
                        }}
                      >
                        Upload
                      </button>
                      <button
                        type="button"
                        className={mode === "camera" ? "active" : ""}
                        onClick={() => setMode("camera")}
                      >
                        Camera
                      </button>
                      {mode === "camera" ? (
                        <>
                          <button type="button" onClick={startCamera}>
                            Start
                          </button>
                          <button
                            type="button"
                            onClick={captureFromCamera}
                            disabled={!cameraActive}
                          >
                            Capture
                          </button>
                          <button
                            type="button"
                            onClick={stopCamera}
                            disabled={!cameraActive}
                          >
                            Stop
                          </button>
                        </>
                      ) : null}
                    </div>
                  </div>

                  <div className="preview-side">
                    {previewUrl ? (
                      <div className="preview-panel">
                        <img
                          ref={imageRef}
                          src={previewUrl}
                          alt="Uploaded maize leaf"
                          className="preview-image"
                          onLoad={() => {
                            setImageLoaded(true);
                            if (!analysis) {
                              setStatus(
                                "Image ready. Analysis starting automatically...",
                              );
                            }
                          }}
                        />
                        {analysis?.heatmapUrl ? (
                          <img
                            src={analysis.heatmapUrl}
                            alt="Heatmap overlay"
                            className="heatmap-overlay"
                          />
                        ) : null}
                      </div>
                    ) : (
                      <div className="empty-box">
                        <p>No image selected yet.</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="results-strip">
                  <div className="result-simple">
                    <span className="section-label">Diagnosis</span>
                    {isAnalyzing ? (
                      <div className="result-loading">Analyzing...</div>
                    ) : analysis ? (
                      <>
                        <h3>{analysis.primary.label}</h3>
                        <p>{formatPercent(analysis.primary.probability)}</p>
                        <small>{analysis.affectedZones.join(", ")}</small>
                      </>
                    ) : (
                      <p>Result will appear here after upload.</p>
                    )}
                  </div>

                  <div className="result-simple">
                    <span className="section-label">Recommendation</span>
                    {analysis ? (
                      <>
                        <ul className="recommendation-list">
                          {analysis.diagnosisInfo.recommendations.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                        <small>{analysis.diagnosisInfo.fieldNote}</small>
                        {analysis.diagnosisInfo.sources?.length ? (
                          <div className="source-links">
                            {analysis.diagnosisInfo.sources.map((source) => (
                              <a
                                key={source.url}
                                href={source.url}
                                target="_blank"
                                rel="noreferrer"
                              >
                                {source.label}
                              </a>
                            ))}
                          </div>
                        ) : null}
                      </>
                    ) : (
                      <p>Recommendation will appear after disease detection.</p>
                    )}
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          {activePage === "history" ? (
            <section className="history-layout">
              <div className="history-page-header">
                <div>
                  <span className="section-label">History Page</span>
                  <h2>Search history and recommendation timeline</h2>
                </div>
                {history.length ? (
                  <button
                    type="button"
                    className="clear-btn"
                    onClick={() => {
                      setHistory([]);
                      saveHistory([]);
                    }}
                  >
                    Clear
                  </button>
                ) : null}
              </div>

              {history.length ? (
                <div className="history-list">
                  {history.map((item) => (
                    <article key={item.id} className="history-item">
                      {item.preview ? (
                        <img
                          src={item.preview}
                          alt={item.title}
                          className="history-thumb"
                        />
                      ) : null}
                      <div className="history-text">
                        <div className="history-meta">
                          <span>{formatDateTime(item.createdAt)}</span>
                          <span>{formatPercent(item.confidence)}</span>
                        </div>
                        <h3>{item.title}</h3>
                        <p>{item.recommendation}</p>
                        <small>
                          {item.affectedZones.join(", ")} | {item.modelSource}
                        </small>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="empty-box history-empty">
                  <p>No search history yet.</p>
                </div>
              )}
            </section>
          ) : null}
        </>
    </main>
  );
}

export default App;
