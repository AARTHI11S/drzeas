# Dataset Structure

Use either of these layouts.

## Option 1: Split folders

```text
dataset/
  train/
    Healthy/
    Common_rust/
    Gray_leaf_spot/
  val/
    Healthy/
    Common_rust/
    Gray_leaf_spot/
  test/
    Healthy/
    Common_rust/
    Gray_leaf_spot/
```

## Option 2: One folder with class folders

```text
dataset/
  Healthy/
  Common_rust/
  Gray_leaf_spot/
  Northern_leaf_Blight/
```

If you use option 2, the script automatically creates a validation split from the same folder.
