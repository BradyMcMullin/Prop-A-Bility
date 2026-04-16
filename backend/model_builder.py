import torch
import torch.nn as nn
from torchvision import models

def build_model(num_classes=2, freeze_features=True):
    """
    Builds a MobileNetV3 model for transfer learning.
    
    Args:
        num_classes (int): Number of output classes (2 for failed vs. success).
        freeze_features (bool): If True, freezes the pre-trained weights so 
                                only the classifier head is trained.
    """
    weights = models.MobileNet_V3_Small_Weights.DEFAULT
    model = models.mobilenet_v3_small(weights=weights)
    
    if freeze_features:
        for param in model.features.parameters():
            param.requires_grad = False
            
    # --- UPGRADE: Increase Dropout to 50% ---
    # MobileNetV3's classifier is a Sequential block. Index [2] is the default 
    # 20% Dropout layer. We overwrite it with a 50% Dropout layer to force 
    # the network to learn more robust features and prevent memorization.
    model.classifier[2] = nn.Dropout(p=0.5, inplace=True)
            
    # First, get the number of input features for the last Linear layer.
    in_features = model.classifier[-1].in_features
    
    # Replace the final layer with a new Linear layer that outputs our num_classes
    model.classifier[-1] = nn.Linear(in_features, num_classes)
    
    return model

if __name__ == "__main__":
    print("Building model...")
    model = build_model(num_classes=2, freeze_features=True)
    
    # Create a dummy image tensor [Batch Size, Channels, Height, Width]
    # Matching the 224x224 shape from your data_pipeline.py
    dummy_input = torch.randn(1, 3, 224, 224) 
    
    # Pass the dummy image through the model
    output = model(dummy_input)
    
    print(f"Output shape: {output.shape}") # Expected: [1, 2]
    print("Model builder is ready.")