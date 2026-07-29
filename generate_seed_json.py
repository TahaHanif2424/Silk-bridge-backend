import os
import re
import json
import openpyxl
from pypdf import PdfReader

excel_path = r"C:\Users\tahah\Downloads\Azerbaijan_Packages_FIT_Groups_Jun_Sep_2026.xlsx"
pdf_path = r"C:\Users\tahah\Downloads\FIT 5 NIGHTS 6 DAYS.pdf"
output_json = r"c:\Users\tahah\OneDrive\Desktop\caspian-connect-backend\prisma\seed_data.json"

packages = []

# 1. Parse Excel Packages
if os.path.exists(excel_path):
    print(f"Parsing Excel: {excel_path}")
    wb = openpyxl.load_workbook(excel_path, data_only=True)
    sheet = wb["Packages"]
    
    rows = list(sheet.iter_rows(values_only=True))
    headers = rows[0]
    
    # Map headers to indices
    col_map = {name: idx for idx, name in enumerate(headers) if name is not None}
    
    for row_idx, row in enumerate(rows[1:], start=1):
        if not any(x is not None for x in row):
            continue
            
        segment = row[col_map.get('Segment')]
        code = row[col_map.get('Package Code')]
        name = row[col_map.get('Package Name')]
        duration_str = row[col_map.get('Duration')]
        validity = row[col_map.get('Validity')]
        hotel_cat = row[col_map.get('Hotel Category')]
        fit_price = row[col_map.get('FIT Price PP USD')]
        group_price = row[col_map.get('Group Price PP USD')]
        min_pax = row[col_map.get('Min Pax')]
        route = row[col_map.get('Route')]
        short_program = row[col_map.get('Short Program')]
        includes = row[col_map.get('Includes')]
        excludes = row[col_map.get('Excludes')]
        event_included = row[col_map.get('Event Included')]
        ticket_included = row[col_map.get('Ticket Included')]
        notes = row[col_map.get('Notes')]
        source_url = row[col_map.get('Source / URL')]
        
        if not code or not name or fit_price is None:
            continue
            
        # Clean special chars from hotel category for ID
        cat_clean = str(hotel_cat).replace('*', '').strip()
        pkg_id = f"{code}-{cat_clean}S".upper()
        
        # Duration parse days for difficulty calculation
        duration_days = 1
        if duration_str:
            dur_match = re.search(r'(\d+)D', str(duration_str))
            if dur_match:
                duration_days = int(dur_match.group(1))
                
        # Price mapping
        net_price = float(fit_price)
        retail_price = float(round(net_price * 1.66))
        
        # Group price float
        group_net_price = float(group_price) if group_price is not None else None
        
        # Region mapping
        route_str = str(route or "").lower()
        if "naftalan" in route_str:
            region = "West Region"
        elif any(kw in route_str for kw in ["gabala", "sheki", "shamakhi", "basqal"]):
            region = "Greater Caucasus"
        else:
            region = "Absheron & Baku"
            
        # Difficulty mapping
        difficulty = "Easy"
        segment_str = str(segment or "").lower()
        if "family" in segment_str:
            if duration_days <= 4:
                difficulty = "Easy"
            elif duration_days <= 6:
                difficulty = "Moderate"
            else:
                difficulty = "Challenging"
                
        # Image mapping
        image_url = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=70"
        if "wellness" in segment_str:
            image_url = "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=70"
        elif "mice" in segment_str:
            image_url = "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=70"
        elif "event" in segment_str:
            if "formula" in name.lower() or "f1" in name.lower():
                image_url = "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1200&q=70"
            elif "dream" in name.lower():
                image_url = "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=70"
        elif "greater caucasus" in region.lower():
            image_url = "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=70"

        packages.append({
            "id": pkg_id,
            "title": f"{name} - {hotel_cat} Hotel Category",
            "subtitle": f"{segment} | Route: {route}",
            "region": region,
            "difficulty": difficulty,
            "netPrice": net_price,
            "retailPrice": retail_price,
            "active": True,
            "image": image_url,
            # Aligned fields
            "segment": segment,
            "code": code,
            "duration": str(duration_str) if duration_str else None,
            "validity": validity,
            "hotelCategory": str(hotel_cat),
            "groupNetPrice": group_net_price,
            "minPax": min_pax,
            "route": route,
            "shortProgram": short_program,
            "includes": includes,
            "excludes": excludes,
            "eventIncluded": event_included,
            "ticketIncluded": ticket_included,
            "notes": notes,
            "sourceUrl": source_url
        })

# 2. Parse PDF Trip
if os.path.exists(pdf_path):
    print(f"Parsing PDF: {pdf_path}")
    reader = PdfReader(pdf_path)
    text_page_1 = reader.pages[0].extract_text()
            
    # Page 2 has the pricing
    pdf_pricing = [
        {"id": "FIT-5N6D-PR3", "hotel": "Port Rivoli Hotel 3*", "cat": "3*", "net": 345, "retail": 575},
        {"id": "FIT-5N6D-PP3", "hotel": "Premier Palace 3*", "cat": "3*", "net": 335, "retail": 555},
        {"id": "FIT-5N6D-AH3", "hotel": "Alba Hotel 3*", "cat": "3*", "net": 330, "retail": 550},
        {"id": "FIT-5N6D-PPH4", "hotel": "Premium Park Hotel 4*", "cat": "4*", "net": 375, "retail": 625}
    ]
    
    # Static inclusions / exclusions extracted from PDF page 2 text
    pdf_includes = "Airport transfers; 05 nights accommodation with breakfast at the hotel in Baku; English speaking GUIDE DRIVER services during the excursions; Private transportation support by comfortable vehicle; All taxes; Water."
    pdf_excludes = "Visa; Lunch; Dinner; Air ticket; Personal expenses; Mini bar at hotel."
    pdf_notes = "Rates are net/non-commissionable. We are not holding any rooms at this stage. Standard check-in 14:00-15:00, check-out 12:00."

    for pr in pdf_pricing:
        packages.append({
            "id": pr["id"],
            "title": f"05 Nights 06 Days Tour - {pr['hotel']}",
            "subtitle": f"FIT Program | Route: Baku – Gobustan – Absheron – Shahdag – Gabala",
            "region": "Greater Caucasus",
            "difficulty": "Moderate",
            "netPrice": float(pr["net"]),
            "retailPrice": float(pr["retail"]),
            "active": True,
            "image": "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=70",
            # Aligned fields
            "segment": "FIT Programs",
            "code": "FIT-5N6D",
            "duration": "05 Nights 06 Days",
            "validity": "02 Jun–30 Sep 2026",
            "hotelCategory": pr["cat"],
            "groupNetPrice": None,
            "minPax": "FIT: 2 pax",
            "route": "Baku – Gobustan – Absheron – Shahdag – Gabala",
            "shortProgram": text_page_1,
            "includes": pdf_includes,
            "excludes": pdf_excludes,
            "eventIncluded": "No",
            "ticketIncluded": "—",
            "notes": pdf_notes,
            "sourceUrl": "Local PDF file"
        })

# Write outputs to JSON
with open(output_json, "w", encoding="utf-8") as out:
    json.dump(packages, out, indent=2, ensure_ascii=False)

print(f"Successfully generated seed data for {len(packages)} packages at {output_json}")
