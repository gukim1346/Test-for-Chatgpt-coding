import argparse
from dataclasses import dataclass
from typing import List, Tuple

import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import label, center_of_mass


@dataclass
class SpotResult:
    x: float
    y: float
    area: int


def find_laser_centroid(image_path: str, threshold: int = 127, min_area: int = 5) -> SpotResult:
    """Find the laser spot centroid using connected components and center of mass.

    Returns the largest valid bright component (area >= min_area).
    """
    gray = Image.open(image_path).convert("L")
    arr = np.array(gray)

    binary = (arr > threshold).astype(int)
    label_img, num_features = label(binary)
    if num_features == 0:
        raise ValueError(f"No bright region found in {image_path}")

    labels = range(1, num_features + 1)
    centroids = center_of_mass(binary, label_img, labels)

    candidates: List[SpotResult] = []
    for i, (cy, cx) in enumerate(centroids, start=1):
        area = int(np.sum(label_img == i))
        if area >= min_area:
            candidates.append(SpotResult(x=float(cx), y=float(cy), area=area))

    if not candidates:
        raise ValueError(f"Only noise-like bright spots found in {image_path}. Increase exposure or lower min_area.")

    return max(candidates, key=lambda c: c.area)


def build_linear_calibration(pix1: float, dist1_cm: float, pix2: float, dist2_cm: float) -> Tuple[float, float]:
    """Build linear mapping: distance_cm = m * pixel + b."""
    if np.isclose(pix1, pix2):
        raise ValueError("Calibration failed: two calibration images produced the same pixel coordinate.")
    m = (dist2_cm - dist1_cm) / (pix2 - pix1)
    b = dist1_cm - m * pix1
    return m, b


def estimate_distance(pixel_value: float, m: float, b: float) -> float:
    return m * pixel_value + b


def annotate_image(image_path: str, spot: SpotResult, save_path: str) -> None:
    img = Image.open(image_path).convert("RGB")
    draw = ImageDraw.Draw(img)
    r = 6
    x, y = int(round(spot.x)), int(round(spot.y))
    draw.ellipse([(x - r, y - r), (x + r, y + r)], fill="red", outline="white")
    draw.line([(x - 10, y), (x + 10, y)], fill="yellow", width=2)
    draw.line([(x, y - 10), (x, y + 10)], fill="yellow", width=2)
    img.save(save_path)


def main() -> None:
    parser = argparse.ArgumentParser(description="Laser-spot centroid based distance calibration (2-point).")
    parser.add_argument("--calib10", required=True, help="Image path where target distance is 10 cm")
    parser.add_argument("--calib20", required=True, help="Image path where target distance is 20 cm")
    parser.add_argument("--target", required=True, help="Image path to estimate unknown distance")
    parser.add_argument("--threshold", type=int, default=127, help="Brightness threshold")
    parser.add_argument("--min-area", type=int, default=5, help="Minimum connected-component area")
    parser.add_argument(
        "--axis",
        choices=["x", "y"],
        default="y",
        help="Pixel axis used for calibration (usually y for vertical displacement).",
    )
    parser.add_argument("--save-marked", action="store_true", help="Save centroid-marked images next to inputs")

    args = parser.parse_args()

    s10 = find_laser_centroid(args.calib10, threshold=args.threshold, min_area=args.min_area)
    s20 = find_laser_centroid(args.calib20, threshold=args.threshold, min_area=args.min_area)
    st = find_laser_centroid(args.target, threshold=args.threshold, min_area=args.min_area)

    p10 = s10.y if args.axis == "y" else s10.x
    p20 = s20.y if args.axis == "y" else s20.x
    pt = st.y if args.axis == "y" else st.x

    m, b = build_linear_calibration(p10, 10.0, p20, 20.0)
    dist = estimate_distance(pt, m, b)

    print("=== Laser centroid results ===")
    print(f"10cm image: x={s10.x:.2f}, y={s10.y:.2f}, area={s10.area}")
    print(f"20cm image: x={s20.x:.2f}, y={s20.y:.2f}, area={s20.area}")
    print(f"Target image: x={st.x:.2f}, y={st.y:.2f}, area={st.area}")
    print()
    print("=== Calibration ===")
    print(f"Model: distance_cm = {m:.6f} * pixel_{args.axis} + {b:.6f}")
    print(f"Estimated distance for target: {dist:.2f} cm")

    if args.save_marked:
        annotate_image(args.calib10, s10, args.calib10 + ".marked.jpg")
        annotate_image(args.calib20, s20, args.calib20 + ".marked.jpg")
        annotate_image(args.target, st, args.target + ".marked.jpg")
        print("Marked images saved with suffix .marked.jpg")


if __name__ == "__main__":
    main()
