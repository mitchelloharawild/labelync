# Creating Label Templates

This guide will help you create SVG templates with dates, QR codes, and other special fields for the app.

You can create SVG templates using any vector-based image editor like [Inkscape](https://inkscape.org/). After exporting, you'll need to manually add attributes to elements for special field types such as QR codes and dates.

## Basic Template Structure

Every template is an SVG file with specially marked elements:

```xml
<svg xmlns="http://www.w3.org/2000/svg" width="384" height="240">
  <!-- Your design here -->
  
  <!-- Editable field with id attribute -->
  <text id="my_field" x="100" y="50">Default Text</text>
</svg>
```

Elements you want to be editable must have an `id` attribute. 

Optionally, a `data-label` field can be used to specify a friendly name shown in the form (if not specified, `id` is used instead.)

# Field types

## Text Field

Text fields allow any text to be entered in the form.

```xml
<text 
  id="product_name" 
  x="192" 
  y="100" 
  font-size="24"
  data-label="Product Name">
  Awesome Product
</text>
```

> [!TIP]
> Use `<tspan>` for text that spans multiple lines:
>
> ```xml
> <text id="address" x="50" y="100" font-size="14" data-label="Address">
>   <tspan x="50" dy="0">123 Main Street</tspan>
>   <tspan x="50" dy="18">Apt 4B</tspan>
>   <tspan x="50" dy="18">New York, NY 10001</tspan>
> </text>
> ```
>
> The form will show a textarea for multi-line fields.

## Adding a Date Field

Date fields use a date picker in the form.

```xml
<text 
  id="expiry_date" 
  x="192" 
  y="140" 
  font-size="18"
  data-field-type="date"
  data-label="Expiry Date"
  data-date-format="MM/DD/YYYY">
  12/31/2024
</text>
```

> [!TIP]
> **Format options:**
> - `YYYY-MM-DD` → 2024-12-31
> - `MM/DD/YYYY` → 12/31/2024
> - `DD/MM/YYYY` → 31/12/2024
> - `MMMM D, YYYY` → December 31, 2024
> - `MMM DD, YYYY` → Dec 31, 2024

## Adding a QR Code

QR codes are automatically generated based on the form text.

```xml
<rect 
  id="product_qr" 
  x="150" 
  y="200" 
  width="100" 
  height="100"
  data-field-type="qr"
  data-label="Product URL"
  data-qr-error-correction="M"/>
```

**Important:** Use a `<rect>` element as a placeholder. It will be replaced with the QR code image.

> [!TIP]
> **Error correction levels:**
> - `L`: Basic (7% recovery)
> - `M`: Standard (15% recovery) - **recommended**
> - `Q`: Good (25% recovery)
> - `H`: Best (30% recovery) - use if code might be damaged

## Adding an Image Upload Field

Image fields allow image files to be uploaded, which are converted to grayscale with dithering.

```xml
<image 
  id="company_logo" 
  x="30" 
  y="30" 
  width="80" 
  height="80"
  data-field-type="image"
  data-label="Company Logo"/>
```