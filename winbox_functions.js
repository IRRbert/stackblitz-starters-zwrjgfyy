function measureContentSize(htmlContent) {
    const tempElement = document.createElement('div');
    tempElement.style.visibility = 'hidden';
    tempElement.style.position = 'absolute';
    tempElement.style.width = 'auto';
    tempElement.style.height = 'auto';
    tempElement.style.whiteSpace = 'normal';
    tempElement.innerHTML = htmlContent;
    document.body.appendChild(tempElement);

    const contentWidth = tempElement.offsetWidth;
    const contentHeight = tempElement.offsetHeight;

    tempElement.remove();

    return { width: contentWidth, height: contentHeight };
}
