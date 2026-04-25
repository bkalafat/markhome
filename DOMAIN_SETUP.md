# Custom Domain Setup

Target domain:

```txt
markhome.bkalafat.com
```

Current working URL:

```txt
https://bkalafat.github.io/markhome/
```

## DNS

At the DNS provider for `bkalafat.com`, add:

```txt
Type:  CNAME
Name:  markhome
Value: bkalafat.github.io
TTL:   Auto
```

After DNS resolves, enable the custom domain in GitHub Pages:

```bash
gh api --method PUT repos/bkalafat/markhome/pages -f cname=markhome.bkalafat.com
```

Then update public links from:

```txt
https://bkalafat.github.io/markhome/
```

to:

```txt
https://markhome.bkalafat.com/
```
