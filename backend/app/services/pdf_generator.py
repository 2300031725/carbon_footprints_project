from io import BytesIO
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from typing import Dict, Any, List

def generate_carbon_pdf(user_profile: Dict[str, Any], record: Dict[str, Any], recommendations: List[Dict[str, Any]]) -> BytesIO:
    """
    Generate a styled PDF report summarizing the user's carbon footprint.
    Returns a BytesIO buffer.
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )
    
    story = []
    
    # Custom Palette
    PRIMARY_COLOR = colors.HexColor("#065F46") # Deep Green
    SECONDARY_COLOR = colors.HexColor("#10B981") # Mint Green
    TEXT_COLOR = colors.HexColor("#1F2937") # Charcoal
    LIGHT_BG = colors.HexColor("#F3F4F6")
    
    # Styles
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=PRIMARY_COLOR,
        alignment=0,
        spaceAfter=15
    )
    
    h2_style = ParagraphStyle(
        'SectionHeader',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=16,
        leading=20,
        textColor=PRIMARY_COLOR,
        spaceBefore=15,
        spaceAfter=10,
        keepWithNext=True
    )
    
    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=TEXT_COLOR,
        spaceAfter=6
    )
    
    bold_style = ParagraphStyle(
        'BodyBold',
        parent=body_style,
        fontName='Helvetica-Bold'
    )
    
    tip_title_style = ParagraphStyle(
        'TipTitle',
        parent=body_style,
        fontName='Helvetica-Bold',
        textColor=PRIMARY_COLOR
    )

    # Document Header
    story.append(Paragraph("EcoTrack Carbon Footprint Report", title_style))
    story.append(Paragraph(f"Generated on: {datetime.now().strftime('%B %d, %Y')}", body_style))
    story.append(Spacer(1, 10))
    
    # User Profile Table
    profile_data = [
        [Paragraph("User Profile Info", bold_style), ""],
        [Paragraph("Full Name:", body_style), Paragraph(user_profile.get("name", "N/A"), body_style)],
        [Paragraph("Email Address:", body_style), Paragraph(user_profile.get("email", "N/A"), body_style)],
        [Paragraph("Location:", body_style), Paragraph(f"{user_profile.get('profile', {}).get('city', 'N/A')}, {user_profile.get('profile', {}).get('country', 'N/A')}", body_style)],
        [Paragraph("Household Size:", body_style), Paragraph(str(user_profile.get('profile', {}).get('household_size', 1)), body_style)],
        [Paragraph("Points Earned:", body_style), Paragraph(f"{user_profile.get('points', 0)} Eco Points", body_style)]
    ]
    
    profile_table = Table(profile_data, colWidths=[150, 380])
    profile_table.setStyle(TableStyle([
        ('SPAN', (0, 0), (1, 0)),
        ('BACKGROUND', (0, 0), (1, 0), PRIMARY_COLOR),
        ('TEXTCOLOR', (0, 0), (1, 0), colors.white),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LINEBELOW', (0, 0), (-1, 0), 1, PRIMARY_COLOR),
        ('LINEBELOW', (0, 1), (-1, -1), 0.5, colors.lightgrey),
    ]))
    
    # Change first row text color of table directly
    profile_data[0][0] = Paragraph("User Profile Info", ParagraphStyle('W', parent=bold_style, textColor=colors.white))
    
    story.append(profile_table)
    story.append(Spacer(1, 20))
    
    # Emissions Summary Table
    trans_em = record.get("transportation", {}).get("emission_co2", 0)
    energy_em = record.get("energy", {}).get("emission_co2", 0)
    food_em = record.get("food", {}).get("emission_co2", 0)
    lifestyle_em = record.get("lifestyle", {}).get("emission_co2", 0)
    total_em = record.get("total_emission", 0)
    score = record.get("sustainability_score", 50)
    
    emissions_data = [
        [Paragraph("Carbon Category", ParagraphStyle('W', parent=bold_style, textColor=colors.white)), 
         Paragraph("Monthly Emissions (kg CO2)", ParagraphStyle('W', parent=bold_style, textColor=colors.white)),
         Paragraph("Percentage", ParagraphStyle('W', parent=bold_style, textColor=colors.white))],
        [Paragraph("Transportation", body_style), Paragraph(f"{trans_em:.2f}", body_style), Paragraph(f"{round((trans_em / total_em * 100) if total_em > 0 else 0, 1)}%", body_style)],
        [Paragraph("Energy", body_style), Paragraph(f"{energy_em:.2f}", body_style), Paragraph(f"{round((energy_em / total_em * 100) if total_em > 0 else 0, 1)}%", body_style)],
        [Paragraph("Food Habits", body_style), Paragraph(f"{food_em:.2f}", body_style), Paragraph(f"{round((food_em / total_em * 100) if total_em > 0 else 0, 1)}%", body_style)],
        [Paragraph("Shopping & Lifestyle", body_style), Paragraph(f"{lifestyle_em:.2f}", body_style), Paragraph(f"{round((lifestyle_em / total_em * 100) if total_em > 0 else 0, 1)}%", body_style)],
        [Paragraph("Total Footprint", bold_style), Paragraph(f"{total_em:.2f} kg CO2/month", bold_style), "100%"],
        [Paragraph("Sustainability Score", bold_style), Paragraph(f"{score}/100", bold_style), ""]
    ]
    
    emissions_table = Table(emissions_data, colWidths=[180, 200, 150])
    emissions_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), PRIMARY_COLOR),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LINEBELOW', (0, 0), (-1, 0), 1, PRIMARY_COLOR),
        ('LINEBELOW', (0, 1), (-1, -2), 0.5, colors.lightgrey),
        ('BACKGROUND', (0, 5), (-1, 5), LIGHT_BG),
        ('LINEABOVE', (0, 5), (-1, 5), 1.5, PRIMARY_COLOR),
        ('SPAN', (1, 6), (2, 6)),
    ]))
    story.append(Paragraph("Emissions Breakdown", h2_style))
    story.append(emissions_table)
    story.append(Spacer(1, 20))
    
    # Recommendations Section
    story.append(Paragraph("Personalized Reduction Tips", h2_style))
    
    for i, rec in enumerate(recommendations[:4], 1):
        tip_text = f"<b>{i}. {rec['title']} ({rec['category']})</b><br/>{rec['tip']}<br/><i>Estimated Impact: {rec['impact']} | Savings: {rec['potential_saving']}</i>"
        story.append(Paragraph(tip_text, body_style))
        story.append(Spacer(1, 8))
        
    doc.build(story)
    buffer.seek(0)
    return buffer
