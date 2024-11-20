# from ultralytics import YOLO
# import sys
# import json
# import os

# def detect_bottles(image_path):
#     model_path = r"./controllers/best.pt"  # Update this to the actual path
#     if isinstance(model_path, str) and not os.path.exists(model_path):
#         raise FileNotFoundError(f"Model file not found at {model_path}")
    
#     model = YOLO(model_path)  # Initialize YOLO
#     results = model(image_path)

#     detections = []
#     for result in results:
#         if not hasattr(result, "boxes"):
#             print("No detections found.")
#             continue

#         for box in result.boxes:
#             label_idx = int(box.cls[0].item())  # Ensure index is an integer
#             label = result.names.get(label_idx, "Unknown")  # Handle missing labels
#             detections.append({
#                 "label": label,
#                 "confidence": box.conf[0].item(),
#                 "bbox": box.xyxy[0].tolist()  # Bounding box coordinates
#             })

#     return detections

# if __name__ == "__main__":
#     if len(sys.argv) < 2:
#         print(json.dumps({"error": "No image path provided"}))
#         sys.exit(1)

#     image_path = sys.argv[1]
#     if not os.path.exists(image_path):
#         print(json.dumps({"error": f"Image file not found: {image_path}"}))
#         sys.exit(1)

#     try:
#         detections = detect_bottles(image_path)
#         print(json.dumps(detections))  # Ensure output is valid JSON
#     except Exception as e:
#         print(json.dumps({"error": str(e)}))
#         sys.exit(1)


from ultralytics import YOLO
import sys
import json
import os
import cv2  # Import OpenCV for drawing bounding boxes
import numpy as np

def detect_bottles(image_path):
    model_path = r"./controllers/best.pt"  # Update this to the actual path
    if isinstance(model_path, str) and not os.path.exists(model_path):
        raise FileNotFoundError(f"Model file not found at {model_path}")
    
    model = YOLO(model_path)  # Initialize YOLOv8 model
    results = model(image_path)  # Run inference on the image

    detections = []
    image = cv2.imread(image_path)  # Read the image with OpenCV

    for result in results:
        if not hasattr(result, "boxes"):
            print("No detections found.")
            continue

        for box in result.boxes:
            label_idx = int(box.cls[0].item())  # Ensure index is an integer
            label = result.names.get(label_idx, "Unknown")  # Handle missing labels
            confidence = box.conf[0].item()
            bbox = box.xyxy[0].tolist()  # Bounding box coordinates
            
            # Draw bounding box on the image
            x1, y1, x2, y2 = map(int, bbox)  # Convert to integer coordinates
            color = (0, 255, 0)  # Green color for bounding box
            thickness = 2  # Thickness of the bounding box lines
            image = cv2.rectangle(image, (x1, y1), (x2, y2), color, thickness)

            # Add label and confidence on top of the bounding box
            font = cv2.FONT_HERSHEY_SIMPLEX
            label_text = f"{label}: {confidence:.2f}"
            image = cv2.putText(image, label_text, (x1, y1 - 10), font, 0.5, color, 1, cv2.LINE_AA)

            detections.append({
                "label": label,
                "confidence": confidence,
                "bbox": bbox
            })

    # Save the image with bounding boxes drawn
    output_image_path = "D:\SCHOOLDOCS4THYEAR!!!/CAPSTONE/BottleBot/Web/BottleBot/BottleBot-Backend/testing/sample_images/output_image_with_boxes.jpg"
    cv2.imwrite(output_image_path, image)
    print(f"Image with bounding boxes saved as {output_image_path}")

    return detections

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No image path provided"}))
        sys.exit(1)

    image_path = sys.argv[1]
    if not os.path.exists(image_path):
        print(json.dumps({"error": f"Image file not found: {image_path}"}))
        sys.exit(1)

    try:
        detections = detect_bottles(image_path)
        print(json.dumps(detections))  # Ensure output is valid JSON
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)
