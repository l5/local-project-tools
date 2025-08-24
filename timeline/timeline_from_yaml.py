
import argparse
import yaml
import pandas as pd
import matplotlib.pyplot as plt
from datetime import datetime, timedelta

def get_task_style(style_cfg, task_styles, task_name, lane_styles=None, lane_name=None):
    base = dict(style_cfg or {})
    lane_over = (lane_styles or {}).get(lane_name, {}) if lane_styles else {}
    task_over = (task_styles or {}).get(task_name, {})
    # Precedence: base -> lane -> task
    merged = {**base, **lane_over, **task_over}
    return merged

def apply_theme(ax, style_cfg):
    bg = style_cfg.get("background_color")
    elem = style_cfg.get("element_color")
    if bg:
        ax.set_facecolor(bg)
        if ax.figure:
            ax.figure.set_facecolor(bg)
    if elem:
        # axes spines, ticks, labels
        for spine in ax.spines.values():
            spine.set_color(elem)
        ax.tick_params(colors=elem)
        if ax.title:
            ax.title.set_color(elem)
        # y tick labels if any
        for label in ax.get_yticklabels()+ax.get_xticklabels():
            label.set_color(elem)

def parse_date(s):
    return datetime.strptime(str(s), "%Y-%m-%d")

def load_config(path):
    with open(path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)

def draw_bracket(ax, x0, x1, y_bottom, y_top, label,
                 label_offset=0.2,
                 ls_main="-", ls_side="-.", lw=1.2,
                 color=None, main_color=None, side_color=None, label_color=None):

    # side verticals
    ax.plot([x0, x0], [y_bottom, y_top],
            linestyle=ls_side, linewidth=lw,
            color=(side_color or color))
    ax.plot([x1, x1], [y_bottom, y_top],
            linestyle=ls_side, linewidth=lw,
            color=(side_color or color))

    # top connector
    ax.plot([x0, x1], [y_top, y_top],
            linestyle=ls_main, linewidth=lw,
            color=(main_color or color))

    # label above
    ax.text((x0 + (x1 - x0)/2), y_top + label_offset, label,
            ha="center", va="bottom",
            color=(label_color or main_color or side_color or color))

def main():
    ap = argparse.ArgumentParser(description="Render a Timeline chart from YAML config")
    ap.add_argument("-c", "--config", default="example.yaml", help="Path to YAML config")
    ap.add_argument("-o", "--out", default=None, help="Output image file path (PNG/SVG/PDF)")
    args = ap.parse_args()

    cfg = load_config(args.config)

    tasks_cfg = cfg["tasks"]
    lanes_order = cfg.get("lanes_order", None)
    grouping = cfg["grouping"]  # { lane: [[task, ...], [task, ...], ...] }

    # Build task dataframe
    rows = []
    for t in tasks_cfg:
        lane = t["lane"]
        name = t["task"]
        ttype = t.get("type", "bar")
        if ttype == "milestone":
            start = parse_date(t["date"])
            end = start
        else:
            if "end" in t and t["end"]:
                start = parse_date(t["start"])
                end   = parse_date(t["end"])
            else:
                start = parse_date(t["start"])
                dur = str(t["duration"]).strip()
                n = int(dur[:-1])
                unit = dur[-1]
                if unit == "w":
                    end = start + timedelta(weeks=n) - timedelta(days=1)
                elif unit == "d":
                    end = start + timedelta(days=n-1)
                else:
                    raise ValueError(f"Unsupported duration unit in {dur}")
        rows.append({"task": name, "lane": lane, "type": ttype, "start": start, "end": end})

    df = pd.DataFrame(rows)

    # Lane order
    if lanes_order is None:
        lanes = list(df["lane"].unique())
    else:
        lanes = lanes_order

    # Manual grouping -> y positions
    style = cfg.get("style", {})
    lane_styles = cfg.get("lane_styles", {})
    task_styles = cfg.get("task_styles", {})
    spacing = style.get("row_spacing", 1.2)
    lane_gap = style.get("lane_gap", 0.8)

    y_positions = {}
    lane_bounds = {}
    y = 0
    for lane in lanes:
        rows_in_lane = grouping[lane]
        start_y = y
        for row_idx, task_names in enumerate(rows_in_lane):
            for name in task_names:
                y_positions[(lane, name)] = y
            y += spacing
        lane_bounds[lane] = (start_y, y - spacing)
        y += spacing * lane_gap

    # Axis range
    xmin = df["start"].min() - timedelta(days=cfg.get("xpad_days", 5))
    xmax = df["end"].max() + timedelta(days=cfg.get("xpad_days", 5))

    # Build figure
    fig, ax = plt.subplots(figsize=(style.get("fig_width", 14),
                                    style.get("fig_height", 7)))

    apply_theme(ax, style)

    # Daily vertical lines + weekend shading
    if cfg.get("daily_grid", True):
        cur = xmin.replace(hour=0, minute=0, second=0, microsecond=0)
        while cur <= xmax:
            ax.axvline(cur, linestyle=style.get("daily_line_style", ":"), linewidth=style.get("daily_line_width", 0.6), alpha=style.get("daily_line_alpha", 0.5), color=style.get("daily_line_color", None))
            if cfg.get("shade_weekends", True) and cur.weekday() == 5:  # Saturday
                ax.axvspan(cur, cur + timedelta(days=2), facecolor=style.get("weekend_shade_color", "lightgray"), alpha=style.get("weekend_shade_alpha", 0.25))
            cur += timedelta(days=1)

    # Plot tasks from grouping order (to respect row stacking)
    for lane in lanes:
        rows_in_lane = grouping[lane]
        for task_names in rows_in_lane:
            for name in task_names:
                r = df[(df["lane"]==lane) & (df["task"]==name)].iloc[0]
                yv = y_positions[(lane, name)]
                s, e = r["start"], r["end"]
                if r["type"] == "milestone" or s == e:
                    tsk_style = get_task_style(style, task_styles, name, lane_styles=lane_styles, lane_name=lane)
                    ax.plot(s, yv, marker="D", markersize=tsk_style.get("milestone_size", style.get("milestone_size", 8)), color=tsk_style.get("milestone_color", style.get("milestone_color", "black")))
                    ax.annotate(name, xy=(s, yv), xytext=(tsk_style.get("milestone_label_px", 6), 0), textcoords="offset points", va="center", fontsize=tsk_style.get("font_size", style.get("font_size", 9)), color=tsk_style.get("milestone_text_color", style.get("milestone_text_color", "black")))
                else:
                    width = (e - s).days + 1
                    tsk_style = get_task_style(style, task_styles, name, lane_styles=lane_styles, lane_name=lane)
                    ax.barh(yv, width, left=s, height=tsk_style.get("bar_height", style.get("bar_height", 0.8)), color=tsk_style.get("bar_color", style.get("bar_color", None)))
                    ax.text(s + timedelta(days=max(0.2, width*0.02)), yv, name, va="center", ha="left", fontsize=tsk_style.get("font_size", style.get("font_size", 9)), color=tsk_style.get("text_color", style.get("text_color", None)))

    # Lane separators + labels
    for lane, (y0, y1) in lane_bounds.items():
        ax.axhline(y1 + spacing * 0.5, linestyle="--", linewidth=0.8)
        lane_label_offset = style.get("lane_label_offset_days", 5)
        ax.text(xmin - timedelta(days=lane_label_offset), (y0 + y1) / 2, lane,
                va="center", ha="right",
                fontsize=style.get("lane_font_size", 10),
                fontweight="bold",
                color=style.get("lane_label_color", style.get("element_color", None)))

    # Monday ticks
    mondays = pd.date_range(xmin, xmax, freq="W-MON")
    ax.set_xticks(mondays)
    ax.set_xticklabels([d.strftime("%Y-%m-%d") for d in mondays], rotation=45)

    # Windows: bracket(s) or span(s)
    windows = cfg.get("windows", [])
    # Y range for brackets
    y_bottom = -0.6  # slightly above the x-axis baseline
    y_top_pad = style.get("window_top_pad", 0.8)  # additional headroom above last row
    y_top = y + y_top_pad
    for win in windows:
        w_start = parse_date(win["start"])
        w_end = parse_date(win["end"])
        label = win.get("label", "Window")
        w_style = win.get("style", "bracket")  # 'bracket' or 'span'

        if w_style == "span":
            alpha = float(win.get("alpha", 0.15))
            face = win.get("color", style.get("window_span_color", None))
            textc = win.get("text_color", style.get("window_text_color", None))
            ax.axvspan(w_start, w_end, alpha=alpha, facecolor=face)
            ax.text(w_start + (w_end - w_start)/2, y_top, label, ha="center", va="bottom", color=textc)
        else:
            draw_bracket(ax, w_start, w_end, y_bottom=y_bottom, y_top=y_top, label=label,
                         ls_main=win.get("main_linestyle", style.get("window_main_linestyle", "-")),
                         ls_side=win.get("side_linestyle", style.get("window_side_linestyle", "-.") ),
                         lw=win.get("linewidth", style.get("window_linewidth", 1.2)),
                         color=win.get("color", style.get("window_bracket_color", None)))

    # Adjust y-limits to ensure bracket labels fit
    ax.set_ylim(-1, y_top + 1.0)

    ax.set_yticks([])
    ax.set_title(cfg.get("title", "Timeline"))
    plt.tight_layout()

    out_path = args.out or cfg.get("output", "timeline.png")
    plt.savefig(out_path, bbox_inches="tight")
    print(out_path)

if __name__ == "__main__":
    main()
