---
# Feel free to add content and custom Front Matter to this file.
# To modify the layout, see https://jekyllrb.com/docs/themes/#overriding-theme-defaults

layout: page
title: Tutorials
permalink: tutorials
---

{% for tutorial in site.tutorials %}
  - [{{ tutorial.title }}]({{ tutorial.permalink }}) 
{% endfor %}
